import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

export default function ThreadDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { threadId } = route.params;

    const [thread, setThread] = useState<any>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadThread();
    }, []);

    const loadThread = async () => {
        try {
            const data = await api.getThread(threadId);
            setThread(data.thread);
            setReplies(data.replies || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await api.addReply(threadId, replyText);
            setReplyText('');
            loadThread(); // Reload to see new reply
        } catch (error) {
            console.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.originalPost}>
            <Text style={styles.postTitle}>{thread.title}</Text>
            <Text style={styles.postContent}>{thread.content}</Text>
            <View style={styles.divider} />
            <Text style={styles.replyHeader}>Replies</Text>
        </View>
    );

    const renderReply = ({ item }: { item: any }) => (
        <View style={styles.replyCard}>
            <Text style={styles.replyAuthor}>{item.user_email?.split('@')[0]}</Text>
            <Text style={styles.replyContent}>{item.content}</Text>
            <Text style={styles.replyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thread</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={replies}
                renderItem={renderReply}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a reply..."
                    placeholderTextColor={colors.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !replyText.trim() && styles.disabledSend]}
                    onPress={handleSendReply}
                    disabled={sending || !replyText.trim()}
                >
                    {sending ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={20} color="#000" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    headerTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
    list: { padding: spacing.md },
    originalPost: { marginBottom: spacing.lg },
    postTitle: { ...typography.h2, marginBottom: spacing.md },
    postContent: { ...typography.body, lineHeight: 24, marginBottom: spacing.lg },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
    replyHeader: { ...typography.h3, color: colors.textSecondary, marginBottom: spacing.sm },
    replyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
    replyAuthor: { ...typography.caption, color: colors.primary, marginBottom: 4, fontWeight: '700' },
    replyContent: { ...typography.body, marginBottom: spacing.xs },
    replyDate: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
    inputContainer: { flexDirection: 'row', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
    input: { flex: 1, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, maxHeight: 100, marginRight: spacing.sm },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    disabledSend: { backgroundColor: colors.textMuted }
});
