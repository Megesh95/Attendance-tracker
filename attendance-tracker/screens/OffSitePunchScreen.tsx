import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';

import { useAttendance } from '@/contexts/AttendanceContext';
import { useAuth } from '@/contexts/AuthContext';

import {
  punchOffSiteAttendanceWithSelfie,
  getAttendanceErrorMessage,
} from '@/services/attendanceApi';

export default function OffSitePunchScreen() {
  const { markOffSiteCheckIn } = useAttendance();
  const { employeeId } = useAuth();
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const loadLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to register off-site attendance.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      Alert.alert(
        'Location Error',
        'Unable to fetch your GPS coordinates. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const openCameraAfterGpsSuccess = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to capture your attendance selfie.'
        );
        return;
      }
    }

    setCameraVisible(true);
  };

  const handleRegisterAttendance = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert('Location Unavailable', 'Waiting for GPS coordinates.');
      return;
    }

    try {
      setIsRegistering(true);
      await openCameraAfterGpsSuccess();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
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

  const retakePhoto = () => {
    setPhotoUri(null);
    setCameraVisible(true);
  };

  const completeAttendance = async () => {
    if (employeeId === null) {
      Alert.alert('Session Error', 'Please log in again.');
      router.replace('/');
      return;
    }

    if (photoUri === null) {
      Alert.alert('Photo Missing', 'Please capture a selfie first.');
      return;
    }

    try {
      setIsRegistering(true);

      const result = await punchOffSiteAttendanceWithSelfie({
        employeeId,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        selfieUri: photoUri,
        attendanceType: 'Off-Site',
      });

      if (result.success) {
        markOffSiteCheckIn();
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Attendance Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Attendance Failed', getAttendanceErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  };

  if (photoUri) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.previewContainer} edges={['top', 'bottom']}>
          <Text style={styles.previewTitle}>Selfie Preview</Text>
          <Text style={styles.previewSubtitle}>
            Confirm your photo to complete attendance
          </Text>

          <View style={styles.previewImageWrap}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              isRegistering && styles.registerButtonDisabled,
            ]}
            onPress={completeAttendance}
            activeOpacity={0.9}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>
                Complete Attendance
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakePhoto}
            activeOpacity={0.85}
          >
            <Text style={styles.retakeButtonText}>Retake Selfie</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
            <Text style={styles.cameraTitle}>Attendance Selfie</Text>
            <Text style={styles.cameraSubtitle}>
              Position your face in the frame
            </Text>

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

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {latitude !== null && longitude !== null && (
            <Marker
              coordinate={{ latitude, longitude }}
              title="You"
              pinColor="#2563EB"
            />
          )}
        </MapView>

        {isLoadingLocation && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.mapLoadingText}>
              Getting your location…
            </Text>
          </View>
        )}

        <SafeAreaView style={styles.topBar} edges={['top']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Off-Site Punch</Text>
        </SafeAreaView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.cardHandle} />

        <Text style={styles.cardTitle}>Location Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Latitude</Text>
          <Text style={styles.infoValue}>
            {latitude !== null ? latitude.toFixed(6) : '—'}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 24 }]}>
          <Text style={styles.infoLabel}>Longitude</Text>
          <Text style={styles.infoValue}>
            {longitude !== null ? longitude.toFixed(6) : '—'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (isLoadingLocation || isRegistering) &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegisterAttendance}
          disabled={isLoadingLocation || isRegistering}
          activeOpacity={0.9}
        >
          {isRegistering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>
              Register Attendance
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapLoadingText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  registerButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraSubtitle: {
    fontSize: 15,
    color: '#F3F4F6',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  },
  previewImageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
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
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retakeButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
