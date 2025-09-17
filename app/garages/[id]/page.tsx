'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { Star, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface GarageDetails {
  id: string
  name: string
  description?: string | null
  addressLine1?: string | null
  city?: string | null
  postalCode?: string | null
  photos: { id: string; url: string; isPrimary: boolean }[]
  rating?: number
  reviews?: number
}

interface ReviewItem {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name: string }
}

export default function GarageDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string)
  const [garage, setGarage] = useState<GarageDetails | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  // review form
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [resG, resR] = await Promise.all([
          fetch(`/api/garages/${encodeURIComponent(id)}`),
          fetch(`/api/reviews?garageId=${encodeURIComponent(id)}`),
        ])
        if (resG.ok) {
          const j = await resG.json()
          setGarage(j.garage)
        }
        if (resR.ok) {
          const jr = await resR.json()
          setReviews(Array.isArray(jr.items) ? jr.items : [])
        }
      } catch (e) {
        console.error('load garage details failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const submitReview = async () => {
    if (!user) {
      toast.error('Please login to leave a review')
      return
    }
    if (!id) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garageId: id, userId: user.id, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Failed to submit review')
        return
      }
      toast.success('Review submitted')
      // Refresh reviews
      const resR = await fetch(`/api/reviews?garageId=${encodeURIComponent(id)}`)
      if (resR.ok) {
        const jr = await resR.json()
        setReviews(Array.isArray(jr.items) ? jr.items : [])
      }
      setComment('')
      setRating(5)
    } catch (e) {
      console.error('submit review failed', e)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!garage) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 text-center text-gray-600">Garage not found</div>
      </div>
    )
  }

  const primaryImage = garage.photos?.find(p => p.isPrimary)?.url || garage.photos?.[0]?.url

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primaryImage} alt={garage.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  {garage.photos?.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {garage.photos.slice(1).map((p) => (
                        <div key={p.id} className="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt="photo" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{garage.name}</h1>
                  {(garage.city || garage.postalCode || garage.addressLine1) && (
                    <div className="flex items-center text-gray-600 mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {[garage.addressLine1, garage.city, garage.postalCode].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold">{garage.rating ?? 0}</span>
                    </div>
                    <Badge variant="secondary">{garage.reviews ?? 0} reviews</Badge>
                  </div>
                  {garage.description && (
                    <p className="text-gray-700 mt-4">{garage.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-gray-600">No reviews yet</div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{r.user?.name || 'User'}</div>
                          <div className="flex items-center text-sm">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            {r.rating}
                          </div>
                        </div>
                        {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
                        <div className="text-xs text-gray-500 mt-2">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Add a review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Math.max(1, Math.min(5, parseInt(e.target.value || '5'))))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={submitting} onClick={submitReview}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
