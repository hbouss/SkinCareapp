// src/screens/StatsScreen.tsx

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../api/client";
import type { StatsResponse, LabelStat, TrendResponse } from "../api/types";
import { translateLabel } from "../i18n/labels";
import { PieChart, BarChart } from "react-native-chart-kit";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Stats">;

const { width } = Dimensions.get("window");
const BASE_CHART_WIDTH = width - 40;
const BAR_ITEM_WIDTH = 75;
const EXTRA_MARGIN = 40;

const COLORS = [
  "#E63946", "#2A9D8F", "#457B9D", "#E5989B",
  "#9D4EDD", "#8B4513", "#F4D35E", "#EE9B00",
  "#343A40", "#6C757D"
];

export default function StatsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<LabelStat | null>(null);

  // 1) Charger les stats
  useEffect(() => {
    api.get<StatsResponse>("/skin/stats")
       .then(r => setStats(r.data))
       .catch(console.error);
  }, []);

  // 2) Charger la tendance (uniquement pour respecter l’ordre des hooks)
  useEffect(() => {
    api.get<TrendResponse>(`/skin/trend?period=${period}`)
       .then(r => setTrend(r.data))
       .catch(() => {});
  }, [period]);

  // Top 3 des labels
  const top3 = useMemo(() => {
    if (!stats) return [];
    return [...stats.by_label]
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }, [stats]);

  // Calcul du delta pour les flèches
  const deltas = useMemo(() => {
    if (!trend) return {};
    const pts = trend.trend;
    if (!pts.length) return {};
    return Object.keys(pts[0].averages).reduce<Record<string, number>>((acc, lbl) => {
      const first = (pts[0].averages[lbl] || 0) * 100;
      const last  = (pts[pts.length - 1].averages[lbl] || 0) * 100;
      acc[lbl] = last - first;
      return acc;
    }, {});
  }, [trend]);

  if (!stats) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS[0]} />
      </View>
    );
  }

  // Données pour le PieChart
  const pieData = stats.by_label.map((it, i) => ({
    name: it.label,
    percent: it.percent,
    color: COLORS[i % COLORS.length],
    legendFontColor: "#333",
    legendFontSize: 14,
  }));

  // Données pour le BarChart
  const nonZero = stats.by_label.filter(s => s.count > 0)
                       .sort((a, b) => b.count - a.count);
  const zeros   = stats.by_label.filter(s => s.count === 0);
  const sorted  = [...nonZero, ...zeros];

  // Étiquettes multi-lignes
  const barLabels = sorted
    .map(s => translateLabel(s.label))
    .map(label => label.split(" ").join("\n"));

  const barCounts = sorted.map(s => s.count);
  const segments  = Math.ceil(Math.max(...barCounts) / 10) || 1;
  const barWidth  = barLabels.length * BAR_ITEM_WIDTH + EXTRA_MARGIN;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITRE */}
      <Text style={styles.title}>
        Vous avez effectué{" "}
        <Text style={styles.highlight}>{stats.total_sessions}</Text> analyses
      </Text>

      {/* TOP 3 CARDS */}
      <View style={styles.top3Container}>
        {top3.map((lbl, idx) => {
          const delta = deltas[lbl.label] || 0;
          const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "";
          const arrowColor = delta > 0 ? "#E63946" : delta < 0 ? "#2A9D8F" : "#999";
          return (
            <View
              key={lbl.label}
              style={[styles.top3Card, { borderColor: COLORS[idx] }]}
            >
              <Text style={[styles.top3Rank, { color: COLORS[idx] }]}>
                #{idx + 1}
              </Text>
              <Text
                style={styles.top3Label}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {translateLabel(lbl.label)}
              </Text>
              <View style={styles.top3PercentRow}>
                <Text style={styles.top3Percent}>
                  {lbl.percent.toFixed(1)}%
                </Text>
                {!!arrow && (
                  <Text style={[styles.trendArrow, { color: arrowColor }]}>
                    {arrow}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* PIE CHART */}
      <View style={[styles.card, styles.pieCard]}>
        <Text style={styles.chartTitle}>Répartition des détections</Text>
        <View style={styles.pieWrapper}>
          <PieChart
            data={pieData}
            width={BASE_CHART_WIDTH}
            height={220}
            accessor="percent"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            chartConfig={{
              backgroundGradientFrom: "#FFF6F0",
              backgroundGradientTo: "#FFEFEA",
              color: (op = 1) => `rgba(232,106,74,${op})`,
              labelColor: (op = 1) => `rgba(51,51,51,${op})`,
            }}
            hasLegend={false}
          />
          <View style={styles.centerCircle}>
            <Text style={styles.centerText}>{stats.total_sessions}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {pieData.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={styles.legendItem}
              onPress={() => {
                setSelected(stats.by_label[i]);
                setModalVisible(true);
              }}
            >
              <View style={[styles.swatch, { backgroundColor: d.color }]} />
              <Text style={styles.legendText}>
                {translateLabel(d.name)} — {d.percent.toFixed(1)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BAR CHART */}
      <View style={[styles.card, styles.barCard]}>
        <Text style={styles.chartTitle}>Nombre de détections</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={{ labels: barLabels, datasets: [{ data: barCounts }] }}
            width={Math.max(BASE_CHART_WIDTH, barWidth)}
            height={300}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            segments={segments}
            chartConfig={{
              backgroundGradientFrom: "#FDF5EF",
              backgroundGradientTo: "#FFF6F0",
              decimalPlaces: 0,
              color: (op = 1) => `rgba(232,106,74,${op})`,
              labelColor: () => "#333",
              style: { borderRadius: 16 },
              fillShadowGradient: "#E86A4A",
              fillShadowGradientOpacity: 1,
            }}
            style={styles.barChart}
            showValuesOnTopOfBars
            withInnerLines={false}
          />
        </ScrollView>
      </View>

      {/* MODAL DÉTAIL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>
                  {translateLabel(selected.label)}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.highlight}>{selected.count}</Text> détections{"\n"}
                  ({selected.percent.toFixed(1)}%)
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOUTON RETOUR ACCUEIL */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeButtonText}>← Retour à l’accueil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { padding:20, paddingTop:60, backgroundColor:"#FFF6F0", alignItems:"center" },
  loader:           { flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"#FFF6F0" },
  title:            { fontSize:22, fontWeight:"700", color:"#333", marginBottom:24, textAlign:"center" },
  highlight:        { color:"#E63946", fontWeight:"800" },

  top3Container:    { flexDirection:"row", justifyContent:"space-between", width:"100%", marginBottom:24 },
  top3Card:         { flex:1, marginHorizontal:6, paddingVertical:16, borderRadius:12, borderWidth:2,
                      alignItems:"center", backgroundColor:"#FFF",
                      shadowColor:"#000", shadowOpacity:0.1, shadowOffset:{width:0,height:4}, shadowRadius:8 },
  top3Rank:         { fontSize:20, fontWeight:"800", marginBottom:6 },
  top3Label:        { fontSize:16, fontWeight:"600", color:"#333", marginBottom:6, textAlign:"center", flexWrap:"wrap" },
  top3PercentRow:   { flexDirection:"row", alignItems:"center" },
  top3Percent:      { fontSize:24, fontWeight:"900", color:"#E63946" },
  trendArrow:       { fontSize:18, marginLeft:6, fontWeight:"700" },

  card:             { width:"100%", borderRadius:20, padding:16, marginBottom:24, backgroundColor:"#FFF",
                      shadowColor:"#000", shadowOpacity:0.05, shadowOffset:{width:0,height:2}, shadowRadius:10 },
  pieCard:          { backgroundColor:"#FFEFEA", paddingBottom:32 },
  barCard:          { backgroundColor:"#FDF5EF" },
  chartTitle:       { fontSize:16, fontWeight:"600", color:"#E63946", marginBottom:12, textAlign:"center" },

  pieWrapper:       { alignItems:"center", justifyContent:"center" },
  centerCircle:     { position:"absolute", width:100, height:100, borderRadius:50, backgroundColor:"#FFF6F0",
                      alignItems:"center", justifyContent:"center" },
  centerText:       { fontSize:20, fontWeight:"800", color:"#333" },

  legend:           { flexWrap:"wrap", flexDirection:"row", marginTop:16, justifyContent:"center" },
  legendItem:       { flexDirection:"row", alignItems:"center", margin:4 },
  swatch:           { width:14, height:14, borderRadius:3, marginRight:6 },
  legendText:       { fontSize:13, color:"#333" },

  barChart:         { borderRadius:16, marginVertical:16 },

  modalOverlay:     { flex:1, backgroundColor:"rgba(0,0,0,0.4)", justifyContent:"center", alignItems:"center" },
  modalContent:     { width:"80%", backgroundColor:"#FFF", borderRadius:16, padding:20, alignItems:"center" },
  modalTitle:       { fontSize:18, fontWeight:"700", color:"#E63946", marginBottom:10 },
  modalText:        { fontSize:16, color:"#333", textAlign:"center", marginBottom:20 },
  modalClose:       { backgroundColor:"#E63946", paddingVertical:10, paddingHorizontal:20, borderRadius:20 },
  modalCloseText:   { color:"#FFF", fontWeight:"600" },

  homeButton:      { marginTop: 10, paddingVertical: 12, paddingHorizontal: 25, backgroundColor: "#E86A4A", borderRadius: 20 },
  homeButtonText:  { color:"#FFF", fontSize:16, fontWeight:"600" },
});