import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { registerFace } from '@/services/authApi';

export default function FaceRegisterScreen() {
  const { employeeId, setReferenceImagePath } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const ensurePermissionThenShow = useCallback(async () => {
    if (permission?.granted) return;
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to register your face.'
      );
      return;
    }
    setCameraVisible(true);
  }, [permission?.granted, requestPermission]);

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
      });

      if (!photo?.uri) {
        Alert.alert('Capture Failed', 'Could not capture selfie. Please try again.');
        return;
      }

      setPhotoUri(photo.uri);
      setCameraVisible(false);
    } catch {
      Alert.alert('Capture Failed', 'Could not capture selfie. Please try again.');
    }
  };

  const retake = () => {
    setPhotoUri(null);
    setCameraVisible(true);
  };

  const completeRegistration = async () => {
    if (employeeId === null) {
      Alert.alert('Session Error', 'Please log in again.');
      router.replace('/');
      return;
    }

    if (!photoUri) {
      Alert.alert('Photo Missing', 'Please capture a selfie first.');
      return;
    }

    try {
      setIsRegistering(true);

      const result = await registerFace(employeeId, photoUri);

      if (!result.success) {
        Alert.alert('Registration Failed', result.message ?? 'Unable to register face.');
        return;
      }

      setReferenceImagePath(result.referenceImagePath ?? photoUri);
      Alert.alert('Success', 'Face registered successfully', [
        { text: 'OK', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (e) {
      Alert.alert('Registration Failed', 'Network error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!permission?.granted && cameraVisible) {
    // Trigger permission request on first render for a smooth UX.
    void ensurePermissionThenShow();
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.previewContainer} edges={['top', 'bottom']}>
          <Text style={styles.previewTitle}>Face Preview</Text>
          <Text style={styles.previewSubtitle}>
            Register this selfie as your master face reference
          </Text>

          <View style={styles.previewImageWrap}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>

          <TouchableOpacity
            style={[styles.completeButton, isRegistering && styles.buttonDisabled]}
            onPress={completeRegistration}
            disabled={isRegistering}
            activeOpacity={0.9}
          >
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Register Face</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Text style={styles.retakeButtonText}>Retake Selfie</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (!cameraVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          <Text style={styles.cameraTitle}>Register Your Face</Text>
          <Text style={styles.cameraSubtitle}>Position your face in the frame</Text>

          <View style={styles.cameraSpacer} />

          <TouchableOpacity
            style={styles.captureButton}
            onPress={capturePhoto}
            activeOpacity={0.9}
          >
            <Text style={styles.captureText}>Capture Selfie</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  cameraTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  cameraSubtitle: {
    fontSize: 15,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 6,
  },
  cameraSpacer: {
    flex: 1,
  },
  captureButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  previewImageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  completeButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  retakeButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});

