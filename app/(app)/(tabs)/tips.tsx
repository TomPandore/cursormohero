import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { decode } from 'html-entities';

interface BlogPost {
  id: number;
  created_at: string;
  titre: string;
  image: string;
  contenu: string;
  categorie: string;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return decode(
    html
      .replace(/<[^>]*>/g, '') // Supprime les balises HTML
      .replace(/\s+/g, ' ') // Normalise les espaces
      .trim()
  );
};

export default function TipsScreen() {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('blog')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      // Gestion silencieuse de l'erreur - les articles restent vides
      setArticles([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchArticles();
  };

  const handleArticlePress = (articleId: number) => {
    router.push(`/tips/${articleId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.title}>CONSEILS DU JOUR</Text>
      <Text style={styles.subtitle}>Enrichis ta sagesse de guerrier</Text>

      {articles.map((article) => (
        <TouchableOpacity 
          key={article.id} 
          style={styles.tipCard}
          activeOpacity={0.8}
          onPress={() => handleArticlePress(article.id)}
        >
          <View style={styles.tipImageWrapper}>
            <Image 
              source={{ uri: article.image }} 
              style={styles.tipImage}
              resizeMode="cover"
            />
            <View style={styles.tipBadgeOnImage}>
              <Text style={styles.tipBadgeText}>{article.categorie}</Text>
            </View>
          </View>
          <View style={styles.tipCardContent}>
            <View style={styles.tipTitleRow}>
              <Text style={styles.tipCardTitle} numberOfLines={2}>{article.titre}</Text>
            </View>
            <Text style={styles.tipCardPreview} numberOfLines={3}>{stripHtml(article.contenu)}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {articles.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucun conseil disponible pour le moment.
          </Text>
          <Text style={styles.emptySubtext}>
            Revenez plus tard pour découvrir de nouveaux conseils.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.xs,
    letterSpacing: 2,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    fontSize: 16,
  },
  tipCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tipImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  tipImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  tipCardContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    position: 'relative',
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tipBadgeText: {
    ...FONTS.caption,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '400',
  },
  tipCardTitle: {
    ...FONTS.subheading,
    color: '#F5F5F5',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  tipCardPreview: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyText: {
    ...FONTS.subheading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tipBadgeOnImage: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
}); 