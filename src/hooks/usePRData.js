import { useState, useEffect, useCallback } from 'react'

const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMVAoQGsjSthEljLvDi6TLgdYXN-7TIcxOWufhsKY8UE-lDRHYs7IStEAkyXv22nX04j-gsnsi2mvaV7owQvS1_xCvhIyh7zDUmqQxqxshmledPzAvO_Do8FQyqlLmtyWtkN5jTW-XgrnQssaIQLyAQwoq8gKYrV32TFQpmAOYe3cVHOzDyLBxurngOfSUuzDaWueI-UCjHszC8FoPfqf-DWBg9d6-LSDww_-LEiYZob-MdjHCF34Sooo9o9jypZAPh_Px1ko3JxwFJg925rJN11Kfm618n064u0iprr&lib=MzcgtH_UmsaJrGGgPMpu8tNLt_jJa8ORx"

const CACHE_KEY = 'pr-data'

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded, ignore */ }
}

export function usePRData() {
  const cached = getCached()
  const [data, setData] = useState(cached)
  const [isLoading, setIsLoading] = useState(!cached)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      if (!data) setIsLoading(true)

      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      setData(json)
      setCache(json)
      setIsLoading(false)
    } catch (err) {
      setError(err)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
