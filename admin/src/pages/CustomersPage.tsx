import { useQuery } from '@tanstack/react-query';
import { listCustomersRequest } from '../api/customers';

export function CustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: listCustomersRequest,
  });

  if (isLoading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <h2>Müşteriler</h2>
      <table>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Kod</th>
            <th>Puan</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.fullName}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.loyaltyCode}</td>
              <td>{customer.pointsBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
