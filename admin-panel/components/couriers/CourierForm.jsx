'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const courierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Invalid phone number'),
  telegram_id: z.string().min(1, 'Telegram ID is required'),
  vehicle_type: z.string().optional(),
  vehicle_number: z.string().optional(),
});

/**
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.defaultValues - Default values for form
 * @param {boolean} props.loading - Loading state
 */
export default function CourierForm({ onSubmit, defaultValues, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courierSchema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., John Doe"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+998901234567"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="telegram_id">Telegram ID *</Label>
          <Input
            id="telegram_id"
            {...register('telegram_id')}
            placeholder="123456789"
          />
          {errors.telegram_id && (
            <p className="text-sm text-red-600 mt-1">{errors.telegram_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="vehicle_type">Vehicle Type</Label>
          <Input
            id="vehicle_type"
            {...register('vehicle_type')}
            placeholder="e.g., Motorcycle, Bicycle"
          />
        </div>

        <div>
          <Label htmlFor="vehicle_number">Vehicle Number</Label>
          <Input
            id="vehicle_number"
            {...register('vehicle_number')}
            placeholder="e.g., 01A123BC"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Courier'}
        </Button>
      </div>
    </form>
  );
}
