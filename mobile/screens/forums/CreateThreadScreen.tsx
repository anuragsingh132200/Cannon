import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

export default function CreateThreadScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { forumId, forumName } = route.params;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("Missing Fields", "Please enter a title and content.");
            return;
        }

        setSubmitting(true);
        try {
            await api.createThread(forumId, title, content);
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to create post. Please try again.");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post in #{forumName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What's on your mind?"
                    placeholderTextColor={colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Content</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Share your thoughts..."
                    placeholderTextColor={colors.textMuted}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.submitText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    closeButton: { padding: spacing.xs },
    headerTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
    form: { padding: spacing.lg, flex: 1 },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, fontSize: 16 },
    textArea: { height: 150 },
    submitButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl },
    submitText: { ...typography.button, color: '#000' }
});
