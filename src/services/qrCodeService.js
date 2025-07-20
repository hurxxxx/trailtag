import QRCode from 'qrcode';
import apiClient from './apiClient.js';

class QRCodeService {
    // Create a new QR code for a program
    async createQRCode(programId) {
        try {
            if (!programId) {
                throw new Error('Program ID is required');
            }

            console.log('Attempting QR code creation:', { programId });

            // Create QR code through API
            const response = await apiClient.createQRCode({
                program_id: programId
            });

            console.log('QR code creation response:', response);

            if (response.success) {
                // Generate QR code image
                const qrCodeImage = await this.generateQRCodeImage(response.qrCode.qr_code_data);

                return {
                    success: true,
                    message: 'QR code created successfully',
                    qrCode: {
                        ...response.qrCode,
                        qr_code_image: qrCodeImage
                    }
                };
            } else {
                throw new Error(response.message || 'Failed to create QR code');
            }
        } catch (error) {
            console.error('QR code creation error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create QR code'
            };
        }
    }

    // Generate QR code image as data URL
    async generateQRCodeImage(qrData, options = {}) {
        try {
            const defaultOptions = {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            };

            const qrOptions = { ...defaultOptions, ...options };
            const qrCodeDataURL = await QRCode.toDataURL(qrData, qrOptions);

            return qrCodeDataURL;
        } catch (error) {
            console.error('QR code image generation error:', error);
            throw new Error('Failed to generate QR code image');
        }
    }

    // Get all QR codes for a program
    async getQRCodesByProgram(programId) {
        try {
            const response = await apiClient.getQRCodesByProgram(programId);

            if (response.success) {
                // Generate images for QR codes
                const qrCodesWithImages = await Promise.all(
                    response.qrCodes.map(async (qr) => {
                        const qrCodeImage = await this.generateQRCodeImage(qr.qr_code_data);
                        return {
                            ...qr,
                            qr_code_image: qrCodeImage
                        };
                    })
                );

                return {
                    success: true,
                    qrCodes: qrCodesWithImages
                };
            } else {
                throw new Error(response.message || 'Failed to fetch QR code list');
            }
        } catch (error) {
            console.error('QR code list query error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch QR code list',
                qrCodes: []
            };
        }
    }

    // Get all QR codes
    async getAllQRCodes() {
        try {
            const response = await apiClient.getQRCodes();

            if (response.success) {
                // Generate images for QR codes
                const qrCodesWithImages = await Promise.all(
                    response.qrCodes.map(async (qr) => {
                        const qrCodeImage = await this.generateQRCodeImage(qr.qr_code_data);
                        return {
                            ...qr,
                            qr_code_image: qrCodeImage
                        };
                    })
                );

                return {
                    success: true,
                    qrCodes: qrCodesWithImages
                };
            } else {
                throw new Error(response.message || 'Failed to fetch QR code list');
            }
        } catch (error) {
            console.error('All QR code list query error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch QR code list',
                qrCodes: []
            };
        }
    }

    // Update QR code
    async updateQRCode(qrCodeId, updateData) {
        try {
            const response = await apiClient.updateQRCode(qrCodeId, updateData);

            return {
                success: response.success,
                message: response.message || 'QR code updated successfully',
                qrCode: response.qrCode
            };
        } catch (error) {
            console.error('QR code update error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update QR code'
            };
        }
    }

    // Delete QR code
    async deleteQRCode(qrCodeId) {
        try {
            const response = await apiClient.deleteQRCode(qrCodeId);

            return {
                success: response.success,
                message: response.message || 'QR code deleted successfully'
            };
        } catch (error) {
            console.error('QR code deletion error:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete QR code'
            };
        }
    }

    // Regenerate QR image (without changing content)
    async regenerateQRImage(qrCodeId) {
        try {
            const response = await apiClient.regenerateQRImage(qrCodeId);

            if (response.success) {
                // Generate new QR code image
                const qrCodeImage = await this.generateQRCodeImage(response.qrCode.qr_code_data);

                return {
                    success: true,
                    message: 'QR image regenerated successfully',
                    qrCode: {
                        ...response.qrCode,
                        qr_code_image: qrCodeImage
                    }
                };
            } else {
                throw new Error(response.message || 'Failed to regenerate QR image');
            }
        } catch (error) {
            console.error('QR image regeneration error:', error);
            return {
                success: false,
                message: error.message || 'Failed to regenerate QR image'
            };
        }
    }
}

// Create singleton instance
const qrCodeService = new QRCodeService();

export default qrCodeService;