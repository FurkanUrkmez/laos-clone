export interface MockBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export const mockBranches: MockBranch[] = [
  {
    id: 'b1',
    name: 'Kadıköy Şubesi',
    address: 'Bağdat Cd. No:123, Kadıköy, İstanbul',
    phone: '+90 555 123 45 67',
    hours: '08:00 - 22:00',
  },
  {
    id: 'b2',
    name: 'Beşiktaş Şubesi',
    address: 'Barbaros Bulvarı No:45, Beşiktaş, İstanbul',
    phone: '+90 555 765 43 21',
    hours: '08:00 - 23:00',
  },
  {
    id: 'b3',
    name: 'Karşıyaka Şubesi',
    address: 'Cemal Gürsel Cd. No:9, Karşıyaka, İzmir',
    phone: '+90 555 111 22 33',
    hours: '09:00 - 22:00',
  },
];
