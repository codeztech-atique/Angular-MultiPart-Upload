import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private uploadParts: string[] = [];
  private barerToken = 'Bearer eyJraWQiOiJPR0IzVFVxc1lnU1RQa3NCWm1EVHJhckVobk52VUpaRHFtYk83YWltVUVVPSIsImFsZyI6IlJTMjU2In0.eyJjdXN0b206c291cmNlIjoiY3VzdG9tIiwic3ViIjoiMTRjODI0MDgtODBlMS03MDgzLTQ1M2UtODYwOWJmMjI1MTA1IiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiZW1haWxfdmVyaWZpZWQiOnRydWUsImN1c3RvbTp1cGRhdGVkQnkiOiJhdGlxdWVAaG9seXJlYWRzLmNvbSIsImN1c3RvbTpkZXZpY2VUeXBlIjoiV0VCIiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfcGxkWHRYRzdBIiwiY29nbml0bzp1c2VybmFtZSI6IjE0YzgyNDA4LTgwZTEtNzA4My00NTNlLTg2MDliZjIyNTEwNSIsImNvZ25pdG86cm9sZXMiOlsiYXJuOmF3czppYW06OjY5NDIxNDAwNTkxODpyb2xlXC9hYmJha2lkLWFkbWluIl0sImF1ZCI6IjFrZmpucWNta2M2N2tnNWN2bXZzbnA4bGI4IiwiY3VzdG9tOmNyZWF0ZWRCeSI6ImF0aXF1ZUBob2x5cmVhZHMuY29tIiwiZXZlbnRfaWQiOiI1YmNhYjQ3NC1jMzg1LTQ4ZGYtYjgwYi03NTlhZWM0MWY5ZGYiLCJjdXN0b206bmFtZSI6IkF0aXF1ZSBBaG1lZCIsImN1c3RvbTpwcm9maWxlaWQiOiIxIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2OTU2NTc4MzcsImN1c3RvbTpwcm9maWxldXJsIjoiaHR0cHM6XC9cL2Rldi1zdGF0aWMuYWJiYWtpZC5jb21cL3Byb2ZpbGVcL2RlZmF1bHRcL3Byb2ZpbGUucG5nIiwiZXhwIjoxNjk1NzQ0MjM3LCJjdXN0b206cm9sZSI6ImFkbWluIiwiaWF0IjoxNjk1NjU3ODM3LCJlbWFpbCI6ImF0aXF1ZUBob2x5cmVhZHMuY29tIn0.U_5RCNjTOYt69xP5PFZftNgxtjOWN5fb3HSJp0yup4CPyI6hlyutXd9H2zHgkSaBiYlGG2fqJXbOOF_AAwKIp0He-A1wGNn0r8Av0D-G90BLCcbiKrTqEEtXLlQJbTr8L3PQW_2p7Xb_uS9IEp7dtO4tYgSF7jK75p4qRwlmDjOOR0SOlFnpAqjAj7pPCzXYpEOJAIC5QyMiukTwaeHQn3klQ9i_qzpq6axeEKOS_TBOSMKhTNPOxahxZYS4-mK4tZuPRLVmPz5yWT6H8lI9ZZJNxnri4uQ0jMPWMzBh8C-57ynjw3P__xxuUTKfJeNIMRinE_eLyoPlMCB-s2SHgA'; // Replace with your actual bearer token

  constructor(private http: HttpClient) {}

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
        key: fileToUpload.name,
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

    await this.completeUpload(uploadId, fileToUpload.name, CHUNKS_COUNT);
  }

  private async startUpload(fileToUpload: File): Promise<string> {
    // Replace with your backend API endpoint for starting the upload
    const startUploadUrl = 'http://localhost:8081/user/start-upload';

    const headers = new HttpHeaders({
      Authorization: this.barerToken,
      // Other required headers if any
    });

    try {
      const formData = {
        fileName: fileToUpload.name,
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
