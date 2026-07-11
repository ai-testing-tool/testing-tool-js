/** File or inline attachment on a result or step. */
export interface Attachment {
  file_name: string;
  mime_type: string;
  file_path: string | null;
  content: string | Buffer;
  size: number;
  id: string;
}
