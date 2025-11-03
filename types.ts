
export interface Company {
  id: string;
  name: string;
  logo: string; 
  description: string;
  products: string;
  targetAudience: string;
  toneOfVoice: string;
  contact: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 URL of the image
}