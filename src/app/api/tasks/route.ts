import { NextResponse } from 'next/server';

// Generates daily tasks based on current date and garden state
export async function GET() {
  const month = new Date().getMonth() + 1;
  const tasks = [];

  // General seasonal tasks
  if ([3, 4, 5].includes(month)) {
    tasks.push(
      { id: '1', task: 'Prepare soil beds for spring planting', type: 'preparation', done: false },
      { id: '2', task: 'Check for frost damage on early plants', type: 'inspection', done: false },
      { id: '3', task: 'Start seeds indoors for warm-season crops', type: 'planting', done: false },
    );
  } else if ([6, 7, 8].includes(month)) {
    tasks.push(
      { id: '1', task: 'Water deeply in the early morning', type: 'watering', done: false },
      { id: '2', task: 'Mulch around plants to retain moisture', type: 'maintenance', done: false },
      { id: '3', task: 'Harvest ripe vegetables regularly', type: 'harvest', done: false },
    );
  } else if ([9, 10, 11].includes(month)) {
    tasks.push(
      { id: '1', task: 'Plant garlic and autumn crops', type: 'planting', done: false },
      { id: '2', task: 'Collect seeds from best plants', type: 'harvest', done: false },
      { id: '3', task: 'Add compost to empty beds', type: 'preparation', done: false },
    );
  } else {
    tasks.push(
      { id: '1', task: 'Plan next season garden layout', type: 'planning', done: false },
      { id: '2', task: 'Order seeds for spring', type: 'planning', done: false },
      { id: '3', task: 'Clean and sharpen garden tools', type: 'maintenance', done: false },
    );
  }

  return NextResponse.json({ tasks, month });
}
