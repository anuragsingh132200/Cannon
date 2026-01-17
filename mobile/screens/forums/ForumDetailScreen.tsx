import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

export default function ForumDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { forumId, forumName, isAdminOnly } = route.params;

    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadThreads();
        }, [forumId])
    );

    const loadThreads = async () => {
        try {
            const result = await api.getThreads(forumId);
            setThreads(result.threads || []);
        } catch (error) {
            console.error("Failed to load threads", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.threadCard}
            onPress={() => navigation.navigate('ThreadDetail', { threadId: item.id })}
        >
            <View style={styles.threadHeader}>
                <Text style={styles.threadTitle} numberOfLines={2}>{item.title}</Text>
                {item.is_pinned && <Ionicons name="pin" size={16} color={colors.primary} />}
            </View>
            <View style={styles.threadMeta}>
                <Text style={styles.author}>{item.user_email?.split('@')[0] || 'User'}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <View style={styles.replies}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.replyCount}>{item.reply_count}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}># {forumName}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={threads}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No threads yet. Be the first!</Text>
                        </View>
                    }
                />
            )}

            {/* Create Button - Hide if Admin Only */}
            {!isAdminOnly && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateThread', { forumId, forumName })}
                >
                    <Ionicons name="add" size={32} color="#000" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    headerTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
    list: { padding: spacing.md },
    threadCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
    threadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    threadTitle: { ...typography.body, fontWeight: '600', flex: 1 },
    threadMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    author: { ...typography.caption, color: colors.textSecondary },
    date: { ...typography.caption, color: colors.textMuted },
    replies: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    replyCount: { ...typography.caption, color: colors.textMuted },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    emptyState: { padding: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted }
});
