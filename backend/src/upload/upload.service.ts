import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const toStream = require('buffer-to-stream');

export type CloudinarySubFolder = 'Banner' | 'Seller Upload' | 'Default Product';

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File, subFolder?: CloudinarySubFolder): Promise<string> {
    return new Promise((resolve, reject) => {
      const folderPath = subFolder ? `E-commerce MVP/${subFolder}` : 'E-commerce MVP/Seller Upload';
      const upload = cloudinary.uploader.upload_stream(
        { folder: folderPath }, // optional: folder name in cloudinary
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new InternalServerErrorException('Failed to upload image to Cloudinary'));
          }
          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary upload returned no result'));
          }
          resolve(result.secure_url);
        },
      );

      // Stream the buffer to Cloudinary
      toStream(file.buffer).pipe(upload);
    });
  }
}
