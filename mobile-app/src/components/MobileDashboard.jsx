import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const MobileDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('https://api.iapostemanager.com/mobile/dashboard');
      const data = await response.json();
      setMetrics(data.metrics);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>IA Poste Manager</Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.emails_today || 0}</Text>
          <Text style={styles.metricLabel}>Emails Today</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.templates || 0}</Text>
          <Text style={styles.metricLabel}>Templates</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.buttonText}>Generate Email</Text>
      </TouchableOpacity>

      <View style={styles.notificationsContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {notifications.map((notification, index) => (
          <View key={index} style={styles.notificationItem}>
            <Text style={styles.notificationText}>{notification.message}</Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: '#007bff' },
  metricLabel: { fontSize: 14, color: '#666', marginTop: 5 },
  actionButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, marginBottom: 20 },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  notificationsContainer: { backgroundColor: 'white', padding: 15, borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  notificationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  notificationText: { fontSize: 14, color: '#333' },
  notificationTime: { fontSize: 12, color: '#999', marginTop: 2 }
});

export default MobileDashboard;