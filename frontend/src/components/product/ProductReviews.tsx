'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { checkReviewEligibility, getReviews, postReview } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/types';

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={cn('text-lg', i <= value ? 'text-gold' : 'text-line', onChange && 'cursor-pointer')}
          aria-label={`${i} sao`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState<{ canReview: boolean; reason: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [msg, setMsg] = useState('');

  const average =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const load = useCallback(async () => {
    const r = await getReviews(productId);
    setReviews(r.data);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (status === 'authenticated' && token) {
      checkReviewEligibility(token, productId)
        .then((r) => setEligible(r.data))
        .catch(() => setEligible(null));
    }
  }, [status, token, productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setMsg('');
    try {
      await postReview(token, { productId, rating, content: content || undefined });
      setContent('');
      setMsg('Cảm ơn bạn đã đánh giá!');
      setEligible({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này' });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gửi đánh giá thất bại');
    }
  }

  return (
    <section className="mt-20 max-w-3xl">
      <div className="mb-6 flex items-baseline gap-4">
        <h2 className="text-display-md">Đánh giá</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-graphite">
            <Stars value={Math.round(average)} /> {average.toFixed(1)}/5 · {reviews.length} đánh giá
          </span>
        )}
      </div>

      {/* Form đánh giá */}
      {status === 'unauthenticated' ? (
        <p className="mb-8 text-sm text-mist">
          <button className="link-underline text-ink" onClick={() => signIn('keycloak')}>Đăng nhập</button>{' '}
          để đánh giá sản phẩm.
        </p>
      ) : eligible?.canReview ? (
        <form onSubmit={submit} className="mb-10 rounded-xl2 border border-line bg-bone p-6">
          <p className="eyebrow mb-2">Chấm điểm</p>
          <Stars value={rating} onChange={setRating} />
          <textarea
            className="mt-3 w-full rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink"
            rows={3}
            placeholder="Cảm nhận của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-3"><Button type="submit">Gửi đánh giá</Button></div>
          {msg && <p className="mt-2 text-sm text-sage">{msg}</p>}
        </form>
      ) : eligible ? (
        <p className="mb-8 text-sm text-mist">{eligible.reason}</p>
      ) : null}

      {/* Danh sách */}
      {reviews.length === 0 ? (
        <p className="text-mist">Chưa có đánh giá nào.</p>
      ) : (
        <ul className="space-y-6">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-6">
              <div className="mb-1 flex items-center gap-3">
                <span className="font-medium">{r.customer.fullName}</span>
                <Stars value={r.rating} />
              </div>
              {r.content && <p className="text-sm text-graphite">{r.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
