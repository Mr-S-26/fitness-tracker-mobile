import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseLogger from '@/components/workout/ExerciseLogger';

const DUMMY_DATA = [
  {
    exercise_name: 'Bench Press',
    sets: [{ set_number: 1, weight: 60, target_reps: 10, completed: false }]
  }
];

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ExerciseLogger sessionId="test" exercises={DUMMY_DATA} />
    </SafeAreaView>
  );
}