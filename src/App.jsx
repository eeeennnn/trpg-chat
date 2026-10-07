import { useEffect, useState } from 'react'
import { supabase } from './utils/supabase'

function App() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const roomId = 'sangdeokri'
  const userName = '나'

  // 기존 메시지 불러오기 + 실시간 연결
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('메시지 불러오기 실패:', error)
        return
      }

      setMessages(data)
    }

    loadMessages()

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 메시지 보내기
  const sendMessage = async () => {
    if (!message.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_name: userName,
        content: message.trim(),
      })

    if (error) {
      console.error('메시지 보내기 실패:', error)
      alert('메시지를 보내지 못했어요.')
      return
    }

    setMessage('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.chatBox}>
        <h1>🎲 TRPG Chat</h1>

        <div style={styles.roomInfo}>
          상덕리 조사방 · 실시간 채팅
        </div>

        <div style={styles.messages}>
          {messages.map((item) => (
            <div key={item.id} style={styles.message}>
              <strong>{item.user_name}</strong>
              <div>{item.content}</div>
            </div>
          ))}
        </div>

        <div style={styles.inputArea}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
          />

          <button onClick={sendMessage}>
            보내기
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
    boxSizing: 'border-box',
  },

  chatBox: {
    width: '100%',
    maxWidth: '700px',
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },

  roomInfo: {
    color: '#666',
    marginBottom: '20px',
  },

  messages: {
    minHeight: '400px',
    maxHeight: '500px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
  },

  message: {
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },

  inputArea: {
    display: 'flex',
    gap: '10px',
  },

  input: {
    flex: 1,
  },
}

export default App