import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../../../components/coach/ChatScreen';

export default function Conversation() {
  const { conversationId } = useLocalSearchParams();
  return <ChatScreen conversationId={conversationId ?? null} />;
}
