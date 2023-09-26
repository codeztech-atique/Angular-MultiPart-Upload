import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getFileExtension } from './utils/index';
import * as uuid from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private uploadParts: string[] = [];
  private barerToken = 'Bearer eyJraWQiOiJPR0IzVFVxc1lnU1RQa3NCWm1EVHJhckVobk52VUpaRHFtYk83YWltVUVVPSIsImFsZyI6IlJTMjU2In0.eyJjdXN0b206c291cmNlIjoiY3VzdG9tIiwic3ViIjoiZTRmODE0YTgtMjA0MS03MGFmLTk3NTktNjljYjA1ZGJlMDU3IiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiZW1haWxfdmVyaWZpZWQiOnRydWUsImN1c3RvbTp1cGRhdGVkQnkiOiJkZXZlbG9wZXIucGF0b2xpeWFAZ21haWwuY29tIiwiY3VzdG9tOmRldmljZVR5cGUiOiJXRUIiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9wbGRYdFhHN0EiLCJjb2duaXRvOnVzZXJuYW1lIjoiZTRmODE0YTgtMjA0MS03MGFmLTk3NTktNjljYjA1ZGJlMDU3IiwiY29nbml0bzpyb2xlcyI6WyJhcm46YXdzOmlhbTo6Njk0MjE0MDA1OTE4OnJvbGVcL2FiYmFraWQtYWRtaW4iXSwiYXVkIjoiMWtmam5xY21rYzY3a2c1Y3ZtdnNucDhsYjgiLCJjdXN0b206Y3JlYXRlZEJ5IjoiZGV2ZWxvcGVyLnBhdG9saXlhQGdtYWlsLmNvbSIsImV2ZW50X2lkIjoiM2M0YTI3OTYtZGVjYS00ODhlLTkzOGMtYWUyMGJjNjFkODcyIiwiY3VzdG9tOm5hbWUiOiJWaWpheSBQYXRvbGl5YSIsImN1c3RvbTpwcm9maWxlaWQiOiIxIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2OTU3MDczMDUsImN1c3RvbTpwcm9maWxldXJsIjoiaHR0cHM6XC9cL2Rldi1zdGF0aWMuYWJiYWtpZC5jb21cL3Byb2ZpbGVcL2RlZmF1bHRcL3Byb2ZpbGUucG5nIiwiZXhwIjoxNjk1NzkzNzA1LCJjdXN0b206cm9sZSI6ImFkbWluIiwiaWF0IjoxNjk1NzA3MzA1LCJlbWFpbCI6ImRldmVsb3Blci5wYXRvbGl5YUBnbWFpbC5jb20ifQ.elV9GKm24zdeciBYgmTjuwS3yvjswgJz5f9bCNWGny4iNI5mQu4gaQ6SfCOQGOsJBNKeDUuvJf4oJHuJVQRdERuFHpVhZqIUdpKoVX86hXogI8LXULIhdSgUJhFjcOzW9ydc1NQUsLk_lDluF4G7xpI96CTaK6M0UGgmkpkYSMcNdDiJqG3w4PndFIzefdr3c2bwnaYQSwR9-ixE50ouFva8P-MJXikZuD4Np0smO8WiUFcz4PE97Kbq0_8HnC-fUS14SG4S9f6lzPFUQK9w_EuQu7KnN7LEUFel14pQs_k44_zKzXZbphcm0zFHQLInfMFDJvpDZCK1de-EdW6n9w'; // Replace with your actual bearer token
  private uuid: any;
  private updatedFileName: any;
  constructor(private http: HttpClient) {
    this.uuid = uuid.v4();
  }

  async uploadFile(
    fileToUpload: File,
    progressCallback: (progress: number) => void
  ): Promise<void> {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size, you can adjust this value as needed
    const CHUNKS_COUNT = Math.ceil(fileToUpload.size / CHUNK_SIZE);

    console.log('FileName: ', fileToUpload.name);
    console.log('Chunk count:', CHUNKS_COUNT)
    const uploadId = await this.startUpload(fileToUpload);

    for (let i = 0; i < CHUNKS_COUNT; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE, fileToUpload.size);
      const chunk = fileToUpload.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk);

      var params = {
        key: this.updatedFileName,
        totalSize: fileToUpload.size.toString(),
        partNo: (i + 1).toString(),
        uploadId: uploadId
      }

      formData.append('data', JSON.stringify(params));

      const percentage = ((i + 1) / CHUNKS_COUNT) * 100;
      progressCallback(percentage);

      var result = await this.uploadChunk(formData);
      var getETag = JSON.parse(JSON.stringify(result));
      this.uploadParts.push(getETag.data.ETag); // Store the ETag value for this chunk
    }

    await this.completeUpload(uploadId, this.updatedFileName, CHUNKS_COUNT);
  }

  private async startUpload(fileToUpload: File): Promise<string> {
    // Replace with your backend API endpoint for starting the upload
    const startUploadUrl = 'http://localhost:8081/user/start-upload';

    const headers = new HttpHeaders({
      Authorization: this.barerToken,
      // Other required headers if any
    });

    try {

      // Modify the file name - Starts here
      // Extract the first word from the file name
      var firstWord = fileToUpload.name.split(' ')[0];

      // Its a first word
      if(firstWord.includes('.')) {
        firstWord = firstWord.split('.')[0];
      }
          
      // Generate an 8-character UUID
      const uniqueId =  this.uuid.slice(0, 8);

      const extension = getFileExtension(fileToUpload.name);

      // Construct the new file name
      this.updatedFileName = `${firstWord}_${uniqueId}${extension}`;



      // Modify the file name - Ends here
      const formData = {
        fileName: this.updatedFileName,
        mimetype: fileToUpload.type
      }
      
      const response = await firstValueFrom(
        this.http.post<{ uploadId: string }>(startUploadUrl, formData, { headers })
      );

      return response.uploadId;
    } catch (error) {
      // Handle error here if needed
      console.error(error);
      throw new Error('Failed to start upload');
    }
  }

  private async uploadChunk(formData: FormData): Promise<any> {
    // Replace with your backend API endpoint for uploading chunks
    const uploadChunkUrl = 'http://localhost:8081/user/upload-parts';
    const headers = new HttpHeaders({
      Authorization: this.barerToken,
      // Other required headers if any
    });

    try {
      return await firstValueFrom(this.http.post<any>(uploadChunkUrl, formData, { headers }));
    } catch (error) {
      // Handle error here if needed
      console.error(error);
      throw new Error('Failed to upload chunk');
    }
  }

  private async completeUpload(
    uploadId: string,
    fileName: string,
    partsCount: number
  ): Promise<void> {
    // Replace with your backend API endpoint for completing the upload
    const completeUploadUrl = 'http://localhost:8081/user/complete-upload';

    const parts = Array.from({ length: partsCount }, (_, i) => ({
      ETag: this.uploadParts[i],
      PartNumber: i + 1,
    }));

    const headers = new HttpHeaders({
      Authorization: this.barerToken,
      // Other required headers if any
    });

    try {
      await firstValueFrom(
        this.http.post(completeUploadUrl, { uploadId, fileName, parts }, { headers })
      );
    } catch (error) {
      // Handle error here if needed
      console.error(error);
      throw new Error('Failed to complete upload');
    }
  }
}
