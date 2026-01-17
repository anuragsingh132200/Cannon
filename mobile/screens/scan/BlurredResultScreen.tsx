/**
 * Blurred Result Screen - Paywall
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

export default function BlurredResultScreen() {
    const navigation = useNavigation<any>();
    const [scan, setScan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadScan();
    }, []);

    // Poll for results if still processing
    useEffect(() => {
        if (scan?.processing_status === 'processing') {
            setProcessing(true);
            const interval = setInterval(async () => {
                try {
                    const result = await api.getLatestScan();
                    setScan(result);
                    if (result.processing_status !== 'processing') {
                        setProcessing(false);
                        clearInterval(interval);
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [scan?.processing_status]);

    const loadScan = async () => {
        try {
            const result = await api.getLatestScan();
            setScan(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const overallScore = scan?.analysis?.overall_score ?? scan?.analysis?.metrics?.overall_score ?? null;
    const isProcessing = processing || scan?.processing_status === 'processing';

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading results...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header with conditional back button */}
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButton} />
                )}
                <Text style={styles.title}>Scan Complete!</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                {isProcessing ? (
                    <>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
                        <Text style={styles.processingText}>Analyzing your photos...</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.score}>{overallScore !== null ? parseFloat(overallScore).toFixed(1) : '?'}</Text>
                        <Text style={styles.scoreMax}>/10</Text>
                    </>
                )}
            </View>

            <View style={styles.lockedSection}>
                <View style={styles.lockedItem}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.lockedText}>Detailed Metrics</Text>
                </View>
                <View style={styles.lockedItem}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.lockedText}>Improvement Suggestions</Text>
                </View>
                <View style={styles.lockedItem}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.lockedText}>Course Recommendations</Text>
                </View>
                <View style={styles.lockedItem}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.lockedText}>Progress Tracking</Text>
                </View>
            </View>

            <View style={styles.unlockCard}>
                <Ionicons name="star" size={32} color={colors.warning} />
                <Text style={styles.unlockTitle}>Unlock Full Results</Text>
                <Text style={styles.unlockDesc}>Get access to detailed analysis, personalized courses, live events, and progress tracking</Text>

                <TouchableOpacity style={styles.unlockButton} onPress={() => navigation.navigate('Payment')}>
                    <Text style={styles.unlockButtonText}>Subscribe Now</Text>
                </TouchableOpacity>

                <Text style={styles.price}>$9.99/month</Text>
            </View>

            {/* Skip for now option */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => navigation.navigate('Payment')}
            >
                <Text style={styles.skipText}>Continue to see pricing options</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.lg, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    title: { ...typography.h1, textAlign: 'center' },
    loadingText: { ...typography.body, marginTop: spacing.md, color: colors.textSecondary },
    processingText: { ...typography.bodySmall, color: colors.textSecondary },
    scoreCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl },
    scoreLabel: { ...typography.bodySmall },
    score: { fontSize: 80, fontWeight: '800', color: colors.primary, lineHeight: 90 },
    scoreMax: { ...typography.h3, color: colors.textMuted },
    lockedSection: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.xl },
    lockedItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: 0.6 },
    lockedText: { ...typography.body },
    unlockCard: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 2, borderColor: colors.primary },
    unlockTitle: { ...typography.h2, marginTop: spacing.md },
    unlockDesc: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.sm },
    unlockButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
    unlockButtonText: { ...typography.button },
    price: { ...typography.caption, marginTop: spacing.sm },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg
    },
    skipText: { ...typography.bodySmall, color: colors.textMuted },
});

