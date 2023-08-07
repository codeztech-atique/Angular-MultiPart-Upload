import { Component } from '@angular/core';
import { UploadService} from './upload.services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [UploadService],
})
export class AppComponent {
  fileToUpload: File | null = null;
  uploadProgress = 0;

  constructor(private uploadService: UploadService) {}

  onFileSelected(event: any) {
    this.fileToUpload = event.target.files[0] as File;
  }

  uploadFile() {
    if (!this.fileToUpload) {
      console.error('No file selected.');
      return;
    }

    this.uploadProgress = 0;

    this.uploadService
      .uploadFile(this.fileToUpload, (progress) => {
        this.uploadProgress = progress;
      })
      .then(() => {
        this.uploadProgress = 100;
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        this.uploadProgress = 0;
      });
  }
}
