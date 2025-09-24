# Sign Recognition Integration

This document describes the sign language recognition feature integrated into the EnhancedChatPage.

## Overview

The sign recognition functionality allows users to input messages using sign language gestures, which are then converted to text and sent to the chat AI. The system uses pose estimation and the SignGPT Client API for recognition.

## Features

### Input Mode Selection

- **Text Mode**: Traditional text input via keyboard
- **Sign Mode**: Sign language input via camera

### Sign Recognition Process

1. **Camera Activation**: When sign mode is selected, users can start recording
2. **Pose Detection**: MediaPipe Holistic tracks hand, face, and body landmarks
3. **Sign Recognition**: Accumulated poses are sent to SignGPT Client API for text conversion
4. **Text Display**: Recognized text is shown with confidence scores
5. **Message Sending**: Users can review and send the recognized text

## Usage

### Switching Input Modes

1. Open the Enhanced Chat page
2. In the input section, toggle between "Text" and "Sign" modes
3. The interface will adapt to show the appropriate input method

### Using Sign Recognition

1. Select "Sign" mode
2. Click "Start Recording" to activate the camera
3. Perform sign language gestures within the camera view
4. The system will display recognized text in real-time
5. Click "Stop Recording" when finished
6. Review the recognized text and click "Send" to submit

### Configuration

#### Environment Variables

Set the following environment variable to configure the SignGPT Client API:

```bash
# For local development
NEXT_PUBLIC_SIGNGPT_CLIENT_URL=http://localhost:8001

# For production, set your actual server URL in .env.local
NEXT_PUBLIC_SIGNGPT_CLIENT_URL=your_production_server_url_here
```

#### API Endpoints

The system expects the SignGPT Client API to provide:

- `POST /recognize` - Sign recognition endpoint
- `GET /health` - Health check endpoint

## Implementation Details

### Components

- **EnhancedChatPage**: Main chat interface with sign recognition
- **VideoPoseProcessor**: Handles camera input and pose detection
- **SignRecognitionService**: Manages sign-to-text conversion

### Services

- **SignRecognitionService**: Core service for sign recognition
  - Buffers poses for better accuracy
  - Integrates with SignGPT Client API
  - Provides fallback mock recognition for development

### Pose Processing

- Uses MediaPipe Holistic for pose estimation
- Tracks face, hands, and body landmarks
- Processes poses at 10fps for real-time recognition
- Accumulates poses over 2-3 seconds for better accuracy

## Development

### Mock Recognition

When the SignGPT Client API is not available, the system uses mock recognition that returns random words for testing purposes.

### Testing

1. Ensure camera permissions are granted
2. Start the development server
3. Navigate to the chat page
4. Switch to sign mode and test recognition

### Troubleshooting

#### Camera Issues

- Check browser permissions for camera access
- Ensure camera is not being used by other applications
- Verify HTTPS is used for camera access in production

#### API Connection

- Verify SignGPT Client API is running on configured URL
- Check network connectivity
- Review browser console for API errors

#### Recognition Accuracy

- Ensure good lighting for camera input
- Position yourself clearly within the camera frame
- Perform signs clearly and at moderate speed
- Check confidence scores for recognition quality

## Future Enhancements

1. **Language Support**: Add support for different sign languages (ASL, KSL, etc.)
2. **User Training**: Allow users to train custom signs
3. **Gesture Feedback**: Provide real-time feedback on sign quality
4. **Offline Mode**: Add offline sign recognition capabilities
5. **Sign Dictionary**: Integrate sign language dictionary for reference

## API Integration

To integrate with a real SignGPT Client API, implement the following endpoints:

### POST /recognize

```json
{
  "poses": [
    {
      "timestamp": 1234567890,
      "landmarks": {
        "face": [...],
        "pose": [...],
        "leftHand": [...],
        "rightHand": [...]
      }
    }
  ],
  "language": "en",
  "signLanguage": "asl",
  "minConfidence": 0.7
}
```

Response:

```json
{
  "text": "hello world",
  "confidence": 0.85,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /health

Response:

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

