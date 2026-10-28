'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { MessageSquareText } from 'lucide-react';
import { checkReviewEligibility, getReviews, postReview } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Avatar, Card, Rating } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage, formatDate } from '@/lib/utils';
import type { Review } from '@/lib/types';

const RATING_TEXT = ['', 'Tệ', 'Chưa ưng', 'Ổn', 'Hài lòng', 'Tuyệt vời'];

export function ProductReviews({ productId }: { productId: string }) {
  const { token, status } = useAccessToken();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState<{ canReview: boolean; reason: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(p === 1);
      try {
        const r = await getReviews(productId, { page: p, pageSize: 6 });
        setReviews((prev) => (p === 1 ? r.data : [...prev, ...r.data]));
        setTotal(r.meta?.total ?? r.data.length);
        setAverage(r.meta?.average ?? 0);
        setTotalPages(r.meta?.totalPages ?? 1);
        setPage(p);
      } catch {
        // đánh giá là phần phụ — lỗi không chặn trang
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    void load(1);
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
    setSubmitting(true);
    try {
      await postReview(token, { productId, rating, content: content.trim() || undefined });
      setContent('');
      setEligible({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này. Cảm ơn bạn!' });
      toast.success('Cảm ơn bạn đã đánh giá!');
      await load(1);
    } catch (err) {
      toast.error(errorMessage(err, 'Gửi đánh giá thất bại'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="mt-20 scroll-mt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Đánh giá</p>
          <h2 className="heading-2">Khách hàng nói gì</h2>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-soft">
            <span className="text-3xl font-extrabold">{average.toFixed(1)}</span>
            <div>
              <Rating value={average} />
              <p className="text-xs text-ink-3">{total} đánh giá</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
              <MessageSquareText className="mx-auto mb-3 text-ink-4" size={28} />
              <p className="font-semibold">Chưa có đánh giá nào</p>
              <p className="mt-1 text-sm text-ink-3">Hãy là người đầu tiên chia sẻ cảm nhận sau khi nhận hàng.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.customer.fullName} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.customer.fullName}</p>
                      <p className="text-xs text-ink-3">{formatDate(r.createdAt)}</p>
                    </div>
                    <Rating value={r.rating} size={14} />
                  </div>
                  {r.content && <p className="mt-3 text-sm leading-relaxed text-ink-2">{r.content}</p>}
                </li>
              ))}
            </ul>
          )}
          {page < totalPages && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={() => load(page + 1)}>
                Xem thêm đánh giá
              </Button>
            </div>
          )}
        </div>

        <Card as="aside" className="h-fit">
          <h3 className="font-bold">Viết đánh giá</h3>
          {status === 'unauthenticated' ? (
            <>
              <p className="mt-1 text-sm text-ink-3">Đăng nhập để chia sẻ cảm nhận về sản phẩm.</p>
              <Button className="mt-4" block variant="outline" onClick={() => signIn('keycloak')}>
                Đăng nhập
              </Button>
            </>
          ) : eligible?.canReview ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Rating value={rating} onChange={setRating} size={26} />
                <span className="text-sm font-semibold text-ink-2">{RATING_TEXT[rating]}</span>
              </div>
              <Textarea rows={4} maxLength={1000} placeholder="Chất liệu, form dáng, size có chuẩn không...?" value={content} onChange={(e) => setContent(e.target.value)} />
              <Button type="submit" block loading={submitting}>
                Gửi đánh giá
              </Button>
            </form>
          ) : (
            <p className="mt-1 text-sm text-ink-3">
              {eligible?.reason ?? 'Bạn có thể đánh giá sau khi đơn hàng chứa sản phẩm này được giao thành công.'}
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
