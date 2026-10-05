export const statuses = ['pending', 'preparing', 'ready', 'picked_up']

export const statusLabels = {
  pending: 'Waiting',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  picked_up: 'Picked up',
}

export const sampleOrders = [
  { id: 1, queueNumber: 1, name: 'Alex Santos', items: 'Chicken rice bowl × 1, Iced tea × 1', status: 'picked_up', time: '11:42 AM' },
  { id: 2, queueNumber: 2, name: 'Jamie Reyes', items: 'Pasta × 1, Lemonade × 1', status: 'ready', time: '11:45 AM' },
  { id: 3, queueNumber: 3, name: 'Sam Cruz', items: 'Chicken rice bowl × 2', status: 'ready', time: '11:47 AM' },
  { id: 4, queueNumber: 4, name: 'Taylor Garcia', items: 'Vegetable rice bowl × 1', status: 'preparing', time: '11:50 AM' },
  { id: 5, queueNumber: 5, name: 'Casey Lim', items: 'Pasta × 1, Iced tea × 2', status: 'preparing', time: '11:52 AM' },
  { id: 6, queueNumber: 6, name: 'Morgan Tan', items: 'Chicken rice bowl × 1', status: 'pending', time: '11:54 AM' },
  { id: 7, queueNumber: 7, name: 'Jordan Ramos', items: 'Sandwich × 2, Lemonade × 1', status: 'pending', time: '11:56 AM' },
]

export function formatQueueNumber(number) {
  return `Q-${String(number).padStart(3, '0')}`
}
