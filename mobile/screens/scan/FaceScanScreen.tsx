/**
 * Face Scan Screen - Capture 3 photos
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

const PHOTO_STEPS = [
    { key: 'front', label: 'Front View', instruction: 'Look straight at the camera' },
    { key: 'left', label: 'Left Profile', instruction: 'Turn your head to show left side' },
    { key: 'right', label: 'Right Profile', instruction: 'Turn your head to show right side' },
];

export default function FaceScanScreen() {
    const navigation = useNavigation<any>();
    const { isPaid, refreshUser } = useAuth();
    const cameraRef = useRef<CameraView>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [photos, setPhotos] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);

    React.useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const takePhoto = async () => {
        if (!cameraRef.current) return;

        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (!photo) return;

        const step = PHOTO_STEPS[currentStep];
        setPhotos((prev) => ({ ...prev, [step.key]: photo.uri }));

        if (currentStep < PHOTO_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // All photos taken, upload
            await uploadPhotos({ ...photos, [step.key]: photo.uri });
        }
    };

    const uploadPhotos = async (allPhotos: { [key: string]: string }) => {
        setLoading(true);
        try {
            const front = { uri: allPhotos.front, type: 'image/jpeg', name: 'front.jpg' };
            const left = { uri: allPhotos.left, type: 'image/jpeg', name: 'left.jpg' };
            const right = { uri: allPhotos.right, type: 'image/jpeg', name: 'right.jpg' };

            const uploadResult = await api.uploadScanImages(front, left, right);
            await api.analyzeScan(uploadResult.scan_id);
            await refreshUser();

            // Route based on payment status
            if (isPaid) {
                navigation.navigate('FullResult');
            } else {
                navigation.navigate('BlurredResult');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload photos');
        } finally {
            setLoading(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.container}><Text style={styles.text}>Requesting camera permission...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.container}><Text style={styles.text}>Camera permission required</Text></View>;
    }

    const step = PHOTO_STEPS[currentStep];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{step.label}</Text>
                <Text style={styles.instruction}>{step.instruction}</Text>
                <View style={styles.progress}>
                    {PHOTO_STEPS.map((_, i) => (
                        <View key={i} style={[styles.progressDot, i <= currentStep && styles.progressDotActive]} />
                    ))}
                </View>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView ref={cameraRef} style={styles.camera} facing={"front" as any}>
                    <View style={styles.overlay}>
                        <View style={styles.faceGuide} />
                    </View>
                </CameraView>
            </View>

            <TouchableOpacity style={styles.captureButton} onPress={takePhoto} disabled={loading}>
                <Ionicons name={loading ? 'hourglass' : 'camera'} size={32} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.hint}>{loading ? 'Analyzing...' : `Photo ${currentStep + 1} of 3`}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: 60, paddingHorizontal: spacing.lg, alignItems: 'center' },
    title: { ...typography.h2 },
    instruction: { ...typography.bodySmall, marginTop: spacing.xs },
    progress: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
    progressDotActive: { backgroundColor: colors.primary },
    cameraContainer: { flex: 1, margin: spacing.lg, borderRadius: borderRadius.lg, overflow: 'hidden' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    faceGuide: { width: 250, height: 320, borderRadius: 125, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
    captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: spacing.lg },
    hint: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xl },
    text: { ...typography.body, textAlign: 'center', marginTop: 100 },
});
