import React, { useEffect, useState, JSX } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Mountain, Compass, Flame, User, Lightbulb } from 'lucide-react-native';
import { decode } from 'html-entities';
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html';

interface BlogPost {
  id: number;
  created_at: string;
  titre: string;
  image: string;
  contenu: string;
  categorie: string;
}

const cleanHtmlContent = (html: string): string => {
  let text = html;
  
  // Supprime tous les attributs data-*
  text = text.replace(/data-[^=]*="[^"]*"/g, '');
  
  // Préserve les balises de liste
  text = text.replace(/<ul>/g, '');
  text = text.replace(/<\/ul>/g, '');
  text = text.replace(/<ol>/g, '');
  text = text.replace(/<\/ol>/g, '');
  text = text.replace(/<li>/g, '• ');
  text = text.replace(/<\/li>/g, '\n');
  
  // Remplace les balises de paragraphe par des retours à la ligne
  text = text.replace(/<p>/g, '');
  text = text.replace(/<\/p>/g, '\n\n');
  
  // Remplace les balises de titre
  text = text.replace(/<h2>/g, '');
  text = text.replace(/<\/h2>/g, '\n\n');
  text = text.replace(/<h3>/g, '');
  text = text.replace(/<\/h3>/g, '\n\n');
  
  // Remplace les balises strong
  text = text.replace(/<strong>/g, '');
  text = text.replace(/<\/strong>/g, '');
  
  // Supprime toutes les autres balises HTML
  text = text.replace(/<[^>]*>/g, '');
  
  // Nettoie les espaces et retours à la ligne multiples
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

const renderFormattedText = (text: string): (string | JSX.Element)[] => {
  const cleanedText = cleanHtmlContent(text);
  
  const parts = cleanedText.split(/(<strong[^>]*>.*?<\/strong>)/g);
  return parts.map((part, index) => {
    if (part.startsWith('<strong')) {
      const strongText = part.replace(/<strong[^>]*>(.*?)<\/strong>/g, '$1');
      return (
        <Text key={index} style={styles.boldText}>
          {decode(strongText)}
        </Text>
      );
    }
    return decode(part);
  });
};

const processText = (html: string): string => {
  let text = decode(html);
  
  text = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
  
  text = text.replace(/<(?!\/?(strong|h2|h3)[^>]*>)[^>]*>/g, '');
  
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return text.trim();
};

const renderHeading = (text: string, level: 2 | 3, key: string) => {
  const style = level === 2 ? styles.heading2 : styles.heading3;
  return (
    <Text key={key} style={style}>
      {decode(text)}
    </Text>
  );
};

const renderParagraph = (text: string, key: string) => {
  if (text.includes('<h2')) {
    const headingText = text.replace(/<h2[^>]*>(.*?)<\/h2>/g, '$1').trim();
    return renderHeading(headingText, 2, key);
  }
  if (text.includes('<h3')) {
    const headingText = text.replace(/<h3[^>]*>(.*?)<\/h3>/g, '$1').trim();
    return renderHeading(headingText, 3, key);
  }

  const processedText = processText(text);
  return (
    <Text key={key} style={styles.paragraph}>
      {renderFormattedText(processedText)}
    </Text>
  );
};

const renderListItem = (text: string, key: string) => {
  const processedText = processText(text);
  return (
    <View key={key} style={styles.listItemContainer}>
      <View style={styles.bullet} />
      <Text style={styles.listItem}>
        {renderFormattedText(processedText)}
      </Text>
    </View>
  );
};

const renderContent = (html: string) => {
  if (!html) return null;

  // Découpe le HTML sur les balises <ul> pour isoler les listes
  const parts = html.split(/(<ul>[\s\S]*?<\/ul>)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('<ul>')) {
      // On est dans une liste à puces
      const items = Array.from(part.matchAll(/<li>([\s\S]*?)<\/li>/g)).map(match => match[1]);
      return (
        <View key={`ul-${idx}`} style={styles.listContainer}>
          {items.map((item, i) => (
            <View key={`li-${i}`} style={styles.listItemContainer}>
              <View style={styles.bullet} />
              <Text style={styles.listItem}>{decode(item.trim())}</Text>
            </View>
          ))}
        </View>
      );
    } else {
      // Le reste (titres, paragraphes, etc.)
      const text = cleanHtmlContent(part);
      const paragraphs = text.split('\n\n');
      return paragraphs.map((paragraph, pIndex) => {
        if (!paragraph.trim()) return null;
        // Titres h2
        if (paragraph.match(/^.+?\u00a0?\n?$/) && paragraph === paragraph.toUpperCase()) {
          return (
            <Text key={`h2-${idx}-${pIndex}`} style={styles.heading2}>{decode(paragraph.trim())}</Text>
          );
        }
        return (
          <Text key={`p-${idx}-${pIndex}`} style={styles.paragraph}>{decode(paragraph.trim())}</Text>
        );
      });
    }
  });
};

const mentorImg = require('@/assets/mentor-mohero.png');

const VioletBullet = () => (
  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 10, marginTop: 8 }} />
);

export default function TipsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('blog')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    switch(lowerCategory) {
      case 'nutrition':
        return COLORS.clan.ekloa;
      case 'entrainement':
        return COLORS.clan.onotka;
      case 'mental':
        return COLORS.clan.okwaho;
      case 'hygiène de vie':
        return COLORS.clan.ekloa;
      default:
        return COLORS.primary;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <Image 
            source={{ uri: article.image }} 
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <View style={styles.categoryBadgeTag}>
              <Text style={styles.categoryTextTag}>{article.categorie}</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {article.titre}
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <RenderHtml
            contentWidth={width}
            source={{ html: article.contenu }}
            baseStyle={{ color: '#E0E0E0', fontSize: 16, fontFamily: FONTS.body.fontFamily }}
            tagsStyles={{
              p: { marginBottom: 12, lineHeight: 22 },
              ul: { marginBottom: 16, paddingLeft: 18 },
              li: {
                marginBottom: 4,
                paddingLeft: 4,
                color: '#E0E0E0',
                fontSize: 16,
                flexDirection: 'row',
                alignItems: 'center',
              },
              h2: {
                color: '#fff',
                fontSize: 22,
                fontWeight: '700',
                marginTop: 28,
                marginBottom: 10,
                lineHeight: 28,
              },
              h3: {
                color: '#F5F5F5',
                fontSize: 18,
                fontWeight: '600',
                marginTop: 18,
                marginBottom: 18,
                lineHeight: 24,
              },
              strong: { fontWeight: 'bold' },
            }}
            enableExperimentalMarginCollapsing={true}
          />
        </View>
        {/* Bloc mentor inspiré de la capture */}
        <View style={styles.mentorBlockContainer}>
          <Image source={mentorImg} style={styles.mentorBlockImage} resizeMode="cover" />
          <Text style={styles.mentorBlockQuote}>
            "Rappelle-toi que chaque geste nourrit ton corps et ton esprit."
          </Text>
        </View>
        {/* Pied de page immersif */}
        <View style={styles.footerContainer}>
        </View>
      </ScrollView>
      {/* Menu de navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(app)/(tabs)/totem')}>
          <Mountain size={24} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Totem</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(app)/(tabs)/voies')}>
          <Compass size={24} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Voies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(app)/(tabs)/ritual')}>
          <View style={styles.centerTabButton}>
            <Flame size={26} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(app)/(tabs)/tips')}>
          <Lightbulb size={24} color={COLORS.primary} />
          <Text style={[styles.tabLabel, { color: COLORS.primary }]}>Conseils</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(app)/(tabs)/account')}>
          <User size={24} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    marginBottom: SPACING.lg,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  headerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: [{ translateY: -30 }],
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    ...FONTS.heading,
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryBadgeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  categoryTextTag: {
    ...FONTS.caption,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0.5,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  date: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.xl,
    lineHeight: 32,
  },
  articleContent: {
    flex: 1,
  },
  heading2: {
    ...FONTS.heading,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  heading3: {
    ...FONTS.subheading,
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  paragraph: {
    ...FONTS.body,
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  subheading: {
    ...FONTS.subheading,
    color: COLORS.text,
    fontSize: 20,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listContainer: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: SPACING.sm,
  },
  listItem: {
    ...FONTS.body,
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  errorText: {
    ...FONTS.subheading,
    color: COLORS.error,
    textAlign: 'center',
  },
  boldText: {
    ...FONTS.body,
    fontWeight: '700',
    color: '#F5F5F5',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    justifyContent: 'flex-end',
  },
  mantraText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  backButtonFooter: {
    backgroundColor: 'rgba(108,68,217,0.85)', // violet branding
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  tribalGlyph: {
    fontSize: 32,
    color: COLORS.textSecondary,
    opacity: 0.18,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  mentorBlockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 18,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  mentorBlockImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginRight: SPACING.xl,
    backgroundColor: COLORS.card,
  },
  mentorBlockQuote: {
    flex: 1,
    ...FONTS.body,
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '400',
    textAlign: 'left',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  centerTabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -35,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
}); 