const signIn = async (email: string, password: string) => {
  try {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('Utilisateur introuvable');

    // 🔍 Vérifie si le profil existe déjà
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    // ✅ Si pas encore de profil → on en crée un maintenant
    if (!profile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        name: user.user_metadata.name,
        email: user.email,
        progress: { totalCompletedDays: 0 }
      });

      if (insertError) throw insertError;
    }

    // 📥 Recharge le profil
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!freshProfile) throw new Error('Profil introuvable');

    const progress = freshProfile.progress as { totalCompletedDays: number };
    const userData: User = {
      id: freshProfile.id,
      name: freshProfile.name,
      email: freshProfile.email,
      clanId: freshProfile.clan_id,
      totalDaysCompleted: progress?.totalCompletedDays || 0,
    };

    setUser(userData);

    // Redirection en fonction du clan
    if (!freshProfile.clan_id) {
      router.replace('/(auth)/onboarding/clan');
    } else {
      router.replace('/(app)/(tabs)/totem');
    }

  } catch (error) {
    console.error('❌ Sign in failed:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
