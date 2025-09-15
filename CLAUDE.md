# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIFI Banana (바나나) is an AI-powered image generation and editing application that uses Google's Gemini API for consistent character and style image creation. The app supports Korean-to-English prompt translation and provides two main features: Shot Image Generation and Image Editing.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default port: 5173)
npm run dev

# Build for production
npm build

# Preview production build
npm preview
```

## Architecture & Key Components

### Core Technologies
- **React 19** with TypeScript
- **Vite** as build tool and dev server
- **Google Gemini API** (@google/genai v0.12.0) for AI image generation
- **Tabler Icons** for UI icons
- **Deployment**: Configured for Netlify (netlify.toml present)

### Main Application Structure

**index.tsx** - Monolithic main component containing:
- Two main tabs: "Shot Generator" (샷 이미지 만들기) and "Edit" (이미지 수정)
- API initialization and management
- Image processing and API communication logic

### Key Functions & API Integration

1. **processAndAssemblePrompt**: Translates Korean prompts to English and structures them for the AI
   - Uses Gemini's `gemini-2.5-flash` model for translation
   - Formats block-style prompts (KEY: VALUE; format)

2. **callImageApi**: Sends images and prompts to Gemini API
   - Uses `gemini-2.5-flash-image-preview` for image generation
   - Handles base64 image conversion and response processing

3. **Image Models Used**:
   - `gemini-2.5-flash-image-preview` - Main image generation model
   - `gemini-2.5-flash` - Korean to English translation

### API Key Management
- Stores API key in localStorage as `gemini_api_key`
- Falls back to `process.env.API_KEY` if not in localStorage
- ApiSetup component handles initial API key configuration

### API Quota Limits (2025)

#### Free Tier Limitations
- **Rate Limits**: 5 requests per minute (1 request every 12 seconds)
- **Daily Quota**: 25 requests per day
- **Reset Time**: Midnight Pacific Time (Korea: 5 PM KST)
- **Token Limit**: 1 million token context window

#### Common Quota Issues & Solutions
1. **429 Error (Quota Exceeded)**:
   - Free tier users hit the 5 RPM or 25 RPD limit
   - Solution: Wait for quota reset or upgrade to paid tier

2. **Upgrading to Paid Tier**:
   - Go to [Google AI Studio](https://aistudio.google.com)
   - Navigate to Settings > Plan Information
   - Click "Set up Billing" to enable paid tier
   - Paid tier offers significantly higher limits

3. **Best Practices**:
   - Implement request queuing (12-second intervals)
   - Cache responses when possible
   - Track daily usage to avoid hitting limits

### Default Prompt Structure
The app uses a block-style prompt format:
```
STYLE: 애니메이션스타일;
MEDIUM: 사실적인 디지털 사진;
CAMERA: 전신샷;
SCENE: 젊은 남녀 둘이 손을 잡고 한강을 산책하고 있다
```

### Styling System
- Custom CSS with modern dark theme (Rails Designer inspired)
- CSS variables for theming in index.css
- Gradient effects and animations for UI elements
- Tab navigation with animated transitions

### File Upload Limits
- Shot Generator: Maximum 8 images (MAX_SHOT_FILES = 8)
- Supports drag-and-drop and click-to-upload

## Current UI State

The application currently has a partially implemented component structure:
- Some components were created but not fully integrated (Header, Navigation, Layout, Common folders exist)
- Main functionality remains in the monolithic index.tsx
- The header shows "AIFI" in orange (text-orange-500) and "바나나" in green (text-accent)

## Important Context for Development

1. **Korean Language Support**: The app is designed for Korean users with Korean UI text and automatic translation of Korean prompts to English before sending to the API.

2. **Image Consistency Focus**: The core feature is maintaining character and style consistency across generated images using reference images.

3. **Tab State Management**: The Edit tab requires an uploaded image from the Shot tab to be activated.

4. **Loading States**: Uses custom Loader component with Korean loading messages during API calls.

5. **Error Handling**: API errors are displayed in Korean, and the app prompts for API key setup if missing.