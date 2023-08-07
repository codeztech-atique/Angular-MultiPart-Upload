import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private uploadParts: string[] = [];
  private barerToken = 'Bearer eyJraWQiOiJPR0IzVFVxc1lnU1RQa3NCWm1EVHJhckVobk52VUpaRHFtYk83YWltVUVVPSIsImFsZyI6IlJTMjU2In0.eyJjdXN0b206c291cmNlIjoiY3VzdG9tIiwic3ViIjoiNTRmODY0MTgtZTAyMS03MDNlLTliMGQtZjQwZjk1Nzc5NmJhIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJjdXN0b206dXBkYXRlZEJ5IjoiYXRpcXVlMTIyNEBnbWFpbC5jb20iLCJjdXN0b206ZGV2aWNlVHlwZSI6IkFuZHJvaWQiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9wbGRYdFhHN0EiLCJjb2duaXRvOnVzZXJuYW1lIjoiNTRmODY0MTgtZTAyMS03MDNlLTliMGQtZjQwZjk1Nzc5NmJhIiwiY29nbml0bzpyb2xlcyI6WyJhcm46YXdzOmlhbTo6Njk0MjE0MDA1OTE4OnJvbGVcL2FiYmFraWQtYWRtaW4iXSwiYXVkIjoiMWtmam5xY21rYzY3a2c1Y3ZtdnNucDhsYjgiLCJjdXN0b206Y3JlYXRlZEJ5IjoiYXRpcXVlMTIyNEBnbWFpbC5jb20iLCJldmVudF9pZCI6Ijg5YjE2M2ExLWIyZTItNDA3MC1hNjBmLTFkNmE0YTcyMTQ2ZCIsImN1c3RvbTpuYW1lIjoiU3VubnkgQWhtZWQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY5MTM5NTMxOCwiY3VzdG9tOnByb2ZpbGV1cmwiOiJodHRwczpcL1wvYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb21cL3VcLzYwMzI0Nzc3P3Y9NCIsImV4cCI6MTY5MTQ4MTcxOCwiY3VzdG9tOnJvbGUiOiJhZG1pbiIsImlhdCI6MTY5MTM5NTMxOCwiZW1haWwiOiJhdGlxdWUxMjI0QGdtYWlsLmNvbSJ9.YMPrj62ezrtUi6YkpQB4ZdbZUSqme8g_594q3DGnhMGumR1C7_bCtHns_Dig3XUiDEgP6l-p80AW2YS0D7d8GNcsY3VVpYfdn-bmN6PlbQSsigQy_DlkIyVYS4_GLr3NdYHaUnUXqNZPucgB6523Wv_ROKfBWFQHu-h6n-JOfTP2bUa5WNoZ0yWS4US2R1-T-mmR_sZsCbDUYL9MbxBjrQwwZHWWDypydRCrwZV-Gmr9DhrmJTYlqSYgoBaiLaq-Rc-JkX1_VmMDp28MonCsq69i9tvd0BDE0uY0uxjo4NwnQAuQSUcIe8qj5_O8FDmK3FIV8qDX-bnIcFLHa8ndEw'; // Replace with your actual bearer token

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
      const formData = new FormData();
      formData.append('file', fileToUpload);

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
