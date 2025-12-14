import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Voice from 'react-native-voice';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: any) => {
    setVoiceText(e.value[0]);
    setIsListening(false);
  };

  const onSpeechError = (e: any) => {
    console.error(e);
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      await Voice.start('fr-FR');
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  const generateEmail = async () => {
    if (!voiceText) {
      Alert.alert('Erreur', 'Veuillez d\'abord enregistrer votre message');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          prompt: voiceText
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        const newEmail = {
          id: Date.now(),
          subject: result.subject,
          body: result.body,
          createdAt: new Date().toLocaleString()
        };
        
        setEmails([newEmail, ...emails]);
        setVoiceText('');
        
        // Text-to-speech confirmation
        Speech.speak('Email généré avec succès', { language: 'fr' });
      } else {
        Alert.alert('Erreur', 'Impossible de générer l\'email');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion au serveur');
    }
  };

  const sendEmail = async (email: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/mails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          to: 'test@example.com',
          subject: email.subject,
          body: email.body
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Email envoyé!');
        Speech.speak('Email envoyé', { language: 'fr' });
      } else {
        Alert.alert('Erreur', 'Échec de l\'envoi');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📧 Email Assistant</Text>
        <Text style={styles.subtitle}>Assistant vocal intelligent</Text>
      </View>

      <View style={styles.voiceSection}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={isListening ? stopListening : startListening}
        >
          <Ionicons 
            name={isListening ? "stop" : "mic"} 
            size={40} 
            color="white" 
          />
        </TouchableOpacity>
        
        <Text style={styles.voiceStatus}>
          {isListening ? 'Écoute en cours...' : 'Appuyez pour parler'}
        </Text>
        
        {voiceText ? (
          <View style={styles.voiceTextContainer}>
            <Text style={styles.voiceText}>{voiceText}</Text>
            <TouchableOpacity style={styles.generateButton} onPress={generateEmail}>
              <Text style={styles.generateButtonText}>Générer Email</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.emailsList}>
        <Text style={styles.sectionTitle}>Emails Générés</Text>
        {emails.map((email: any) => (
          <View key={email.id} style={styles.emailCard}>
            <Text style={styles.emailSubject}>{email.subject}</Text>
            <Text style={styles.emailBody} numberOfLines={3}>
              {email.body}
            </Text>
            <View style={styles.emailActions}>
              <Text style={styles.emailDate}>{email.createdAt}</Text>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={() => sendEmail(email)}
              >
                <Ionicons name="send" size={16} color="white" />
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  voiceSection: {
    alignItems: 'center',
    padding: 20,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#f44336',
  },
  voiceStatus: {
    color: '#ccc',
    fontSize: 16,
  },
  voiceTextContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    width: '100%',
  },
  voiceText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  generateButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emailsList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  emailCard: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  emailSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  emailBody: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  emailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailDate: {
    color: '#888',
    fontSize: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
  },
});