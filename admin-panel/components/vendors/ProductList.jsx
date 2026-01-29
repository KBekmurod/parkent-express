import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import { Package } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.products - Array of products
 */
export default function ProductList({ products }) {
  if (!products || products.length === 0) {
    return <EmptyState message="No products found" icon={Package} />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {product.description || 'No description'}
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_available ? "default" : "secondary"}>
                  {product.is_available ? 'Available' : 'Unavailable'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
