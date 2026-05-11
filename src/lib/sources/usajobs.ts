import type { JobListing } from './types'
import { safeDate } from './types'

interface USAJobsItem {
  MatchedObjectId: string
  MatchedObjectDescriptor: {
    PositionTitle: string
    PositionURI: string
    OrganizationName: string
    QualificationSummary: string
    UserArea?: { Details?: { JobSummary?: string } }
    PositionLocation?: Array<{ LocationName: string; CityName?: string }>
    PublicationStartDate: string
    PositionRemuneration?: Array<{
      MinimumRange: string
      MaximumRange: string
      RateIntervalCode: string
    }>
  }
}

interface USAJobsResponse {
  SearchResult: {
    SearchResultItems: USAJobsItem[]
  }
}

export async function fetchUSAJobs(): Promise<JobListing[]> {
  const res = await fetch(
    'https://data.usajobs.gov/api/Search?Keyword=machine+learning+artificial+intelligence&ResultsPerPage=50&RemoteIndicator=True',
    {
      headers: {
        'User-Agent':       'vasikarla.satish@gmail.com',
        'Authorization-Key': process.env.USAJOBS_API_KEY ?? '',
        Host:               'data.usajobs.gov',
      },
      signal: AbortSignal.timeout(10_000),
    }
  )
  if (!res.ok) throw new Error(`USAJobs HTTP ${res.status}`)

  const data: USAJobsResponse = await res.json()
  const items = data?.SearchResult?.SearchResultItems ?? []

  return items.map(item => {
    const d     = item.MatchedObjectDescriptor
    const rem   = d.PositionRemuneration?.[0]
    const rateMin = rem ? parseFloat(rem.MinimumRange) / 2080 : undefined // annual → hourly
    const rateMax = rem ? parseFloat(rem.MaximumRange) / 2080 : undefined
    const desc  = d.UserArea?.Details?.JobSummary ?? d.QualificationSummary ?? ''
    const loc   = d.PositionLocation?.[0]?.LocationName

    return {
      sourceId:    `usajobs-${item.MatchedObjectId}`,
      sourceUrl:   d.PositionURI,
      title:       d.PositionTitle,
      company:     d.OrganizationName,
      description: desc,
      rateMin:     rateMin && !isNaN(rateMin) ? Math.round(rateMin) : undefined,
      rateMax:     rateMax && !isNaN(rateMax) ? Math.round(rateMax) : undefined,
      rateType:    'hourly' as const,
      jobType:     'remote' as const,
      isRemote:    true,
      location:    loc,
      postedAt:    safeDate(d.PublicationStartDate),
    }
  })
}
