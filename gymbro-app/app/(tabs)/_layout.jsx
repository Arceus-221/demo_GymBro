import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/shared/Icon';
import { typography } from '../../constants/theme';
import { useThemedStyles } from '../../components/shared/ThemeProvider';

/** 4 tabs — HOME / TRAIN / MEALS / AI. There is no Progress tab (Phase 3 §2.0). */
export default function TabsLayout() {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: (p) => <TabItem {...p} icon="home" label="Home" /> }}
      />
      <Tabs.Screen
        name="workout"
        options={{ tabBarIcon: (p) => <TabItem {...p} icon="train" label="Train" /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ tabBarIcon: (p) => <TabItem {...p} icon="meals" label="Meals" /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ tabBarIcon: (p) => <TabItem {...p} icon="coach" label="AI" /> }}
      />
    </Tabs>
  );
}

/**
 * The focused tab swaps to the solid variant and the brand red; the resting
 * state is the outline in muted grey. Both come from the icon map, so neither
 * depends on opacity tricks that wouldn't survive a theme change.
 */
function TabItem({ focused, icon, label }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  return (
    <View style={styles.tabItem}>
      <Icon
        name={focused ? `${icon}Active` : icon}
        size={21}
        color={focused ? colors.brand.redText : colors.text.inverseMuted}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  bar: {
    backgroundColor: colors.surface.inverse,
    borderTopWidth: 0,
    height: 68,
    paddingTop: 8,
  },
  item: { paddingVertical: 0 },
  tabItem: { alignItems: 'center', gap: 3, width: 64 },
  label: { ...typography.eyebrow, fontSize: 9, color: colors.text.inverseMuted },
  labelActive: { color: colors.brand.redText },
});
