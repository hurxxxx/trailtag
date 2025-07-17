import QRCode from 'qrcode';
import apiClient from './apiClient.js';

class QRCodeService {
    // Create a new QR code for a program
    async createQRCode(programId, locationName, userId) {
        try {
            if (!programId || !locationName?.trim()) {
                throw new Error('프로그램 ID와 위치명이 필요합니다');
            }

            console.log('QR 코드 생성 시도:', { programId, locationName });

            // API를 통해 QR 코드 생성
            const response = await apiClient.createQRCode({
                program_id: programId,
                location_name: locationName.trim()
            });

            console.log('QR 코드 생성 응답:', response);

            if (response.success) {
                // QR 코드 이미지 생성
                const qrCodeImage = await this.generateQRCodeImage(response.qrCode.qr_code_data);

                return {
                    success: true,
                    message: 'QR 코드가 성공적으로 생성되었습니다',
                    qrCode: {
                        ...response.qrCode,
                        qr_code_image: qrCodeImage
                    }
                };
            } else {
                throw new Error(response.message || 'QR 코드 생성에 실패했습니다');
            }
        } catch (error) {
            console.error('QR 코드 생성 오류:', error);
            return {
                success: false,
                message: error.message || 'QR 코드 생성에 실패했습니다'
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
            console.error('QR 코드 이미지 생성 오류:', error);
            throw new Error('QR 코드 이미지 생성에 실패했습니다');
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
                throw new Error(response.message || 'QR 코드 목록을 가져오는데 실패했습니다');
            }
        } catch (error) {
            console.error('QR 코드 목록 조회 오류:', error);
            return {
                success: false,
                message: error.message || 'QR 코드 목록을 가져오는데 실패했습니다',
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
                throw new Error(response.message || 'QR 코드 목록을 가져오는데 실패했습니다');
            }
        } catch (error) {
            console.error('전체 QR 코드 목록 조회 오류:', error);
            return {
                success: false,
                message: error.message || 'QR 코드 목록을 가져오는데 실패했습니다',
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
                message: response.message || 'QR 코드가 성공적으로 업데이트되었습니다',
                qrCode: response.qrCode
            };
        } catch (error) {
            console.error('QR 코드 업데이트 오류:', error);
            return {
                success: false,
                message: error.message || 'QR 코드 업데이트에 실패했습니다'
            };
        }
    }

    // Delete QR code
    async deleteQRCode(qrCodeId) {
        try {
            const response = await apiClient.deleteQRCode(qrCodeId);

            return {
                success: response.success,
                message: response.message || 'QR 코드가 성공적으로 삭제되었습니다'
            };
        } catch (error) {
            console.error('QR 코드 삭제 오류:', error);
            return {
                success: false,
                message: error.message || 'QR 코드 삭제에 실패했습니다'
            };
        }
    }
}

// Create singleton instance
const qrCodeService = new QRCodeService();

export default qrCodeService;