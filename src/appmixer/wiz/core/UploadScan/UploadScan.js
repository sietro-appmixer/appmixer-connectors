const lib = require('../../lib');
const crypto = require('crypto');
const uuid = require('uuid').v4;
const moment = require('moment');

const generateContentHash = (content) => {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('sha256').update(contentString).digest('hex').substring(0, 16);
};

const getLockConfiguration = (context) => {

    return {
        retryDelay: parseInt(context.config.uploadLockRetryDelay, 10) || 3000,
        ttl: parseInt(context.config.uploadLockTtl, 10) || 15 * 60 * 1000,
        maxRetryCount: parseInt(context.config.uploadLockMaxRetryCount, 10) || 60
    };
};

module.exports = {

    start(context) {

        context.log({
            step: 'start', lockConfiguration: getLockConfiguration(context)
        });

        const { scheduleValue } = context.properties;
        if (scheduleValue) {
            return this.scheduleDrain(context);
        }
    },

    // docs: https://win.wiz.io/reference/pull-cloud-resources
    async receive(context) {

        const { threshold, scheduleValue } = context.properties;

        if (context.messages.timeout) {
            await this.scheduleDrain(context);
            await this.prepareForSend(context, { threshold });
        } else {
            const { document, filename, integrationId } = context.messages.in.content;

            if (!await context.stateGet('metadata')) {
                await context.stateSet('metadata', { filename, integrationId });
            }

            // await context.stateAddToSet('documents', { id: generateContentHash(document), data: document });
            await context.stateAddToSet('documents', { id: uuid(), data: document });
            const entries = await context.stateGet('documents') || [];

            context.log({ step: 'receive', entries: entries.length });

            if (!scheduleValue || (threshold && entries.length >= threshold)) {
                await this.prepareForSend(context, { threshold });
            }
        }
    },

    async prepareForSend(context, { threshold }) {

        const entriesToUpload = await context.stateSet('documents-upload-batch');
        if (entriesToUpload) {
            context.log({
                step: 'in progress',
                message: `Found ${entriesToUpload.length} documents in documents-upload-batch.`
            });
            return;
        }

        let lock;
        try {

            // https://docs.appmixer.com/6.0/v4.1/component-definition/behaviour#async-context.lock-lockname-options
            lock = await context.lock(context.componentId, getLockConfiguration(context));
            const { integrationId, filename } = await context.stateGet('metadata') || {};
            if (!integrationId || !filename) {
                throw new context.CancelError('No metadata found in state. Cannot send documents.');
            }

            const entriesToUpload = await context.stateSet('documents-upload-batch');
            let documents = [];

            if (entriesToUpload) {
                documents = entriesToUpload.map(entry => entry.data);
                context.log({
                    step: 'documents-upload-batch docs',
                    message: `Prepared ${documents.length} documents for upload.`,
                    lock
                });

            } else {
                const entries = (await context.stateGet('documents') || []);

                await context.stateSet('documents-upload-batch', entries);
                await context.stateUnset('documents');
                context.log({
                    step: 'prepareForSend', message: `Prepared ${entries.length} documents for upload.`, lock
                });
                documents = entries.map(entry => entry.data);
            }

            await this.sendDocuments(context, {
                documents,
                filename,
                integrationId
            });
            await context.stateUnset('documents-upload-batch');

        } finally {
            lock?.unlock();
        }
    },

    async scheduleDrain(context) {

        const { scheduleValue, scheduleType } = context.properties;
        const now = moment();
        const referenceDate = moment();

        if (!['minutes', 'hours', 'days'].includes(scheduleType)) {
            throw new context.CancelError(`Invalid scheduleType: ${scheduleType}`);
        }

        const nextDate = referenceDate.add(scheduleValue, scheduleType);
        const diff = nextDate.diff(now);
        if (diff <= 0) {
            throw new context.CancelError(`Computed timeout is non‑positive (${diff} ms). Check schedule parameters.`);
        }

        await context.setTimeout({}, diff);
    },

    async sendDocuments(context, { documents, filename, integrationId }) {

        // only for testing purposes
        context.log({
            step: 'sendDocuments',
            message: `Sending ${documents.length} documents for integration ${integrationId} with filename ${filename}.`,
            documents: documents.map(doc => doc.id)
        });
        await new Promise(r => setTimeout(r, 20000));
        return context.sendJson({}, 'out');

        //
        // const { url, systemActivityId } = await lib.requestUpload(context, { filename });
        //
        // const fileContent = {
        //     integrationId,
        //     dataSources: documents
        // };
        //
        // await lib.uploadFile(context, { url, fileContent });
        // const systemActivity = await lib.getStatus(context, systemActivityId);
        //
        // // throw error if the system activity is not valid.
        // lib.validateUploadStatus(context, { systemActivity });
        //
        // return context.sendJson(systemActivity, 'out');
    }
};

