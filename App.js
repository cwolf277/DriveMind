import React, { useEffect, useState } from 'react';
import {View, Text, Button, SafeAreaView,StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { OPENAI_API_KEY } from '@env';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView,Swipeable } from 'react-native-gesture-handler';



export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordedURI, setRecordedURI] = useState(null);
  const [notes, setNotes] = useState([]);
  const [expandedNoteIndex, setExpandedNoteIndex] = useState(null);

  const exportNotesToJSON =async () =>{
  try{
    const content = JSON.stringify(notes, null,2);
    const fileUri = FileSystem.documentDirectory + 'drivemindNotes.json';
    await FileSystem.writeAsStringAsync(fileUri,content,{
      encoding: FileSystem.EncodingType.UTF8,
    });
    Alert.alert('Exportted',`saved to: ${fileUri}`);
  }catch(err){
    Alert.alert('Error', 'could not export notes.');
    console.log(err);
  }
}

const handleDeleteNote = (indexToDelete) => {
  const updatedNotes = notes.filter((_, index) => index !== indexToDelete);
  setNotes(updatedNotes);
  AsyncStorage.setItem('driveMindNotes', JSON.stringify(updatedNotes));
};

  useEffect(()=>{
    const loadNotes =async() => {
      const saved = await AsyncStorage.getItem('driveMindNotes');
      if(saved){
        setNotes(JSON.parse(saved));
      }
    };
    loadNotes();
  }, []);

  const startRecording = async() =>{
    try{
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      if(permission.status != 'granted'){
        alert('Permission to acess microphone is required!');
        return;
      }
      console.log('Starting recording..');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const{recording} = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      console.log('recording started');
    }catch(err){
      console.log('Could not start recording', err);
    }
  };

  const stopRecording = async () => {
    try{
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedURI(uri);
      console.log('recording stopped and stored at', uri);
      setRecording(null);
      await transcribeAudio(uri);
    }catch(err){
      console.error('could not stop recording', err);
    }
  };

  const transcribeAudio = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      const formData = new FormData();
      formData.append('file', {
        uri: fileInfo.uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      });
      formData.append('model', 'whisper-1');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const now = new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12 :true,
      });
      const newNote = {
        text: response.data.text,
        timestamp: now,
      };

      setNotes(prevNotes => {
        const updated = [newNote, ...prevNotes]
        AsyncStorage.setItem('driveMindNotes', JSON.stringify(updated));
        return updated;
      });

     
    } catch (error) {
      console.error('Transcription failed:', error.response?.data || error.message);
      Alert.alert('Error', 'Transcription failed.');
    }
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>DriveMind</Text>

      <TouchableOpacity
      style={styles.recordButton}
      onPress={recording ? stopRecording:startRecording}
      >
        <Text style = {styles.recordButtonText}>
          {recording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
            
          <View style={styles.feed}>
          {notes.map((note, index) => {
            const isExpanded = expandedNoteIndex === index;
            const renderRightActions = () =>(
              <TouchableOpacity
              style={styles.deleteButton}
              onPress={()=> handleDeleteNote(index)}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            );
            return(
              <Swipeable key={index} renderRightActions={renderRightActions}>
                <TouchableOpacity
                 style={styles.noteCard}
              onPress={()=>
                setExpandedNoteIndex(isExpanded ? null:index)
              }
              >
                <Text style={styles.noteTime}>{note.timestamp}</Text>
                <Text 
                style={styles.noteText}
                numberOfLines={isExpanded ? 10:2}
                ellipsizeMode='tail'
                >
                  {note.text}
              </Text>
              </TouchableOpacity>
              </Swipeable>
            );
          })}
          </View>
          </SafeAreaView>
          </GestureHandlerRootView>
        );
      }
             
             
              
              
              
              
         

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer:{
    marginVertical: 16,

  },
  uri:{
    marginTop: 20,
    color:'#aaa',
    fontSize: 12,
    textAlign: 'center',
  },

  feed:{
    marginTop: 20,
    width: '90%',
  },

  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 10,
  },

  noteCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

noteText: {
  color: '#fff',
  fontSize: 16,
  lineHeight:22,
},
noteTime: {
  color: '#888',
  fontSize: 13,
  marginBottom: 6,
},
recordButton: {
  backgroundColor: '#333333',
  paddingVertical: 14,
  paddingHorizontal: 40,
  borderRadius: 999,
  alignSelf: 'center',
  marginVertical: 20,
},
recordButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
  textShadowColor: '#000',
  textShadowOffset: {width: 0, height: 1},
  textShadowRadius: 2,
},
bigMicButton:{
  backgroundColor: '#ff3333',
  width: 100,
  height: 100,
  borderRadius: 50,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  marginVertical: 20,
},
micIcon:{
  color: '#fff',
  fontSize: 36,
},
deleteButton:{
  backgroundColor: '#ff4444',
  justifyContent: 'center',
  alignItems: 'center',
  width: 70,
  borderRadius: 12,
  marginVertical: 6,
},
deleteText: {
  color: '#fff',
  fontSize: 20,
},
menuItem:{
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},
menuIcon:{
  fontsize: 20,
  marginRight: 8,
  color: '#fff',
},
menuLabel: {
  fontSize: 16,
  color: '#fff',
},



  
});
