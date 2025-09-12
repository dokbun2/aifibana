
import type React from 'react';

export interface NavItem {
  path: string;
  name: string;
  icon: React.ReactElement;
}

export interface ImageFile {
  file: File;
  preview: string;
  base64: string;
}
