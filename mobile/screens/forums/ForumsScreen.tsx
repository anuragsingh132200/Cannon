/**
 * Forums Screen - Discord-like channels
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/dark';

export default function ForumsScreen() {
    const navigation = useNavigation<any>();
    const [forums, setForums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadForums();
        }, [])
    );

    const loadForums = async () => {
        try {
            setLoading(true);
            const { forums: data } = await api.getForums();
            setForums(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('jawline')) return 'fitness';
        if (lower.includes('skin')) return 'sparkles';
        if (lower.includes('weight') || lower.includes('fat')) return 'body';
        if (lower.includes('announce')) return 'megaphone';
        return 'chatbubbles';
    };

    const renderForum = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.forumCard}
            onPress={() => navigation.navigate('ForumDetail', {
                forumId: item.id,
                forumName: item.name,
                isAdminOnly: item.is_admin_only
            })}
        >
            <View style={styles.forumIcon}>
                <Ionicons name={getIcon(item.name)} size={24} color={colors.primary} />
            </View>
            <View style={styles.forumInfo}>
                <Text style={styles.forumName}># {item.name}</Text>
                <Text style={styles.forumDesc}>{item.description}</Text>
            </View>
            <View style={styles.forumMeta}>
                <Text style={styles.threadCount}>{item.thread_count}</Text>
                <Text style={styles.threadLabel}>threads</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Forums</Text>
                <Text style={styles.subtitle}>Join the community</Text>
            </View>

            <FlatList
                data={forums}
                renderItem={renderForum}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    title: { ...typography.h2 },
    subtitle: { ...typography.caption },
    list: { padding: spacing.lg },
    forumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
    forumIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    forumInfo: { flex: 1, marginLeft: spacing.md },
    forumName: { ...typography.body, fontWeight: '600' },
    forumDesc: { ...typography.caption, marginTop: 2 },
    forumMeta: { alignItems: 'center' },
    threadCount: { ...typography.h3, color: colors.primary },
    threadLabel: { ...typography.caption },
    separator: { height: spacing.md },
});
