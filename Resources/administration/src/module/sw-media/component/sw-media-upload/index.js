import { Component, Mixin, State } from 'src/core/shopware';
import util, { fileReader } from 'src/core/service/util.service';
import template from './sw-media-upload.html.twig';
import './sw-media-upload.less';


Component.register('sw-media-upload', {
    template,

    inject: ['mediaService'],

    mixins: [
        Mixin.getByName('notification')
    ],

    props: {
        catalogId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            showUrlModal: false
        };
    },

    computed: {
        mediaItemStore() {
            return State.getStore('media');
        },

        uploadStore() {
            return State.getStore('upload');
        }
    },

    methods: {
        onClickUpload() {
            this.$refs.fileInput.click();
        },

        openUrlModal() {
            this.showUrlModal = true;
        },

        closeUrlModal() {
            this.showUrlModal = false;
        },

        onUrlUpload({ url, fileExtension }) {
            this.createMediaEntityFromUrl(url, fileExtension);
        },

        onFileInputChange() {
            const newMediaFiles = Array.from(this.$refs.fileInput.files);
            const uploadTag = util.createId();

            this.createNotificationInfo({
                message: this.$tc('sw-media.upload.notificationInfo', newMediaFiles.length, { count: newMediaFiles.length })
            });

            newMediaFiles.forEach((file) => {
                this.addMediaEntityFromFile(file, uploadTag);
            });

            this.uploadStore.runUploads(uploadTag).then(() => {
                this.$emit('new-media-entity');
            });

            this.$refs.fileForm.reset();
        },

        addMediaEntityFromFile(file, tag) {
            this.uploadStore.addUpload(tag, () => {
                const mediaEntity = this.createNewMedia(file.name);
                const successMessage = this.$tc('sw-media.upload.notificationSuccess');
                const errorMessage = this.$tc('sw-media.upload.notificationFailure', 0, { mediaName: mediaEntity.name });

                return mediaEntity.save().then(() => {
                    this.$emit('new-upload-started', mediaEntity);
                    return fileReader.readAsArrayBuffer(file).then((buffer) => {
                        return this.mediaService.uploadMediaById(
                            mediaEntity.id,
                            file.type,
                            buffer,
                            file.name.split('.').pop()
                        );
                    });
                }).then(() => {
                    mediaEntity.isLoading = false;
                    this.createNotificationSuccess({
                        message: successMessage
                    });
                }).catch(() => {
                    this.cleanUpFailure(mediaEntity, errorMessage);
                });
            });
        },

        createMediaEntityFromUrl(url, fileExtension) {
            const mediaEntity = this.createNewMedia(this.getNameFromURL(url));
            const notificationSuccessMessage = this.$tc('sw-media.upload.notificationSuccess');
            const notificationErrorMessage = this.$tc('sw-media.upload.notificationFailure', 0, { mediaName: mediaEntity.name });

            this.createNotificationInfo({
                message: this.$tc('sw-media.upload.notificationInfo', 1, { count: 1 })
            });

            mediaEntity.save().then(() => {
                const uploadTag = mediaEntity.id;
                const mediaService = this.mediaService;

                this.uploadStore.addUpload(uploadTag, () => {
                    mediaEntity.isLoading = true;
                    this.$emit('new-upload-started', mediaEntity);

                    return mediaService.uploadMediaFromUrl(mediaEntity.id, url.href, fileExtension).then(() => {
                        mediaEntity.isLoding = false;
                        this.createNotificationSuccess({
                            message: notificationSuccessMessage
                        });
                    }).catch(() => {
                        this.cleanUpFailure(mediaEntity, notificationErrorMessage);
                    });
                });

                this.uploadStore.runUploads(uploadTag).then(() => {
                    this.$emit('new-media-entity');
                });
                this.closeUrlModal();
            }).catch(() => {
                this.cleanUpFailure(mediaEntity, notificationErrorMessage);
            });
        },

        cleanUpFailure(mediaEntity, errorMessage) {
            this.createNotificationError({
                message: errorMessage
            });
            mediaEntity.delete(true);
            this.mediaItemStore.remove(mediaEntity);
        },

        createNewMedia(name) {
            const mediaEntity = this.mediaItemStore.create();

            mediaEntity.catalogId = this.catalogId;
            mediaEntity.name = name;

            return mediaEntity;
        },

        getNameFromURL(url) {
            let name = url.pathname.split('/').pop().split('.')[0];
            if (name === '') {
                name = url.hostname;
            }
            return name;
        }
    }
});
