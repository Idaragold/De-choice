import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SYSTEM_INSTRUCTION } from '../constants';

export async function getEnhancedSystemInstruction() {
  try {
    const querySnapshot = await getDocs(collection(db, 'knowledge'));
    const customKnowledge = querySnapshot.docs.map(doc => doc.data().content).join('\n');
    
    if (!customKnowledge) return SYSTEM_INSTRUCTION;

    return `${SYSTEM_INSTRUCTION}

ADDITIONAL KNOWLEDGE BASE (Dynamic):
${customKnowledge}

Please prioritize this additional knowledge if it contradicts the base instructions.`;
  } catch (error) {
    console.error("Error fetching custom knowledge:", error);
    return SYSTEM_INSTRUCTION;
  }
}
