import { Badge } from '@/components/ui/badge';
import { formatStatus, getStatusColor } from '@/lib/utils';

/**
 * @param {Object} props
 * @param {string} props.status - Order status
 */
export default function OrderStatusBadge({ status }) {
  return (
    <Badge className={getStatusColor(status)}>
      {formatStatus(status)}
    </Badge>
  );
}
