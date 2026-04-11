'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Link, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  Network, 
  Activity, 
  BarChart3, 
  Database, 
  Hash,
  Clock,
  Zap,
  Globe
} from 'lucide-react'

interface NetworkStatus {
  connected: boolean
  network: string
  blockNumber: number
  gasPrice?: string
  networkId?: number
  latestBlockHash?: string
  error?: string
}

interface AnchoredEvidence {
  id: string
  evidenceHash: string
  networksAnchored: string[]
  timestamp: string
  verificationUrls: Record<string, string>
  multiChainHash: string
}

import { AuditShell } from '@/components/layout/AuditShell'

export default function BlockchainPage() {
  const [networks, setNetworks] = useState<Record<string, NetworkStatus>>({})
  const [anchoredEvidence, setAnchoredEvidence] = useState<AnchoredEvidence[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState('polkadot')
  const [evidenceHash, setEvidenceHash] = useState('')
  const [loading, setLoading] = useState(true)
  const [anchoring, setAnchoring] = useState(false)
  const [verifyHash, setVerifyHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)

  const handleVerifyEvidence = async () => {
    if (!verifyHash.trim()) return

    try {
      setVerifying(true)
      const data = await import('@/lib/api').then(m => m.verifyMultiChainEvidence(verifyHash))
      setVerifyResult(data)
    } catch (error) {
      console.error('Failed to verify evidence:', error)
      setVerifyResult({ overall_verified: false, multi_chain_consensus: false, network_results: {} })
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    fetchNetworkStatus()
    fetchAnchoredEvidence()
  }, [])

  const fetchNetworkStatus = async () => {
    try {
      setLoading(true)
      const data = await import('@/lib/api').then(m => m.getMultiChainStatus())
      
      // Map the snake_case backend keys to the expected camelCase local UI keys
      const formattedNetworks = Object.entries(data).reduce((acc, [key, val]) => {
          acc[key] = {
              connected: val.connected,
              network: val.network,
              blockNumber: val.block_number || 0,
              gasPrice: val.gas_price,
              networkId: val.network_id,
              latestBlockHash: val.latest_block_hash,
              error: val.error,
          }
          return acc
      }, {} as Record<string, NetworkStatus>)

      setNetworks(formattedNetworks)
    } catch (error) {
      console.error('Failed to fetch network status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnchoredEvidence = async () => {
    try {
      const { anchored_evidence } = await import('@/lib/api').then(m => m.getAnchoredEvidence())
      
      const formattedEvidence = anchored_evidence.map(ev => ({
          id: ev.id || Date.now().toString(),
          evidenceHash: ev.evidence_hash,
          networksAnchored: ev.networks_anchored,
          timestamp: ev.timestamp || ev.anchoring_timestamp || new Date().toISOString(),
          verificationUrls: ev.verification_urls || {},
          multiChainHash: ev.multi_chain_hash,
      }))

      setAnchoredEvidence(formattedEvidence)
    } catch (error) {
      console.error('Failed to fetch anchored evidence:', error)
    }
  }

  const handleAnchorEvidence = async () => {
    if (!evidenceHash.trim()) return

    try {
      setAnchoring(true)
      
      const result = await import('@/lib/api').then(m => m.anchorMultiChainEvidence(evidenceHash, { source: "ui_manual_anchor" }))
      
      const newEvidence: AnchoredEvidence = {
        id: result.id || Date.now().toString(),
        evidenceHash: result.evidence_hash,
        networksAnchored: result.networks_anchored || [],
        timestamp: result.anchoring_timestamp || new Date().toISOString(),
        verificationUrls: result.verification_urls || {},
        multiChainHash: result.multi_chain_hash,
      }

      setAnchoredEvidence(prev => [newEvidence, ...prev])
      setEvidenceHash('')
      // Refresh network status to update blocks/gas
      await fetchNetworkStatus()
    } catch (error) {
      console.error('Failed to anchor evidence:', error)
    } finally {
      setAnchoring(false)
    }
  }

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'polkadot':
        return <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">P</div>
      case 'ethereum':
        return <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">ETH</div>
      case 'polygon':
        return <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">MATIC</div>
      default:
        return <Network className="w-8 h-8" />
    }
  }

  return (
    <AuditShell>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Chain Blockchain</h1>
          <p className="text-muted-foreground">
            Anchor and verify audit evidence across multiple blockchain networks
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Activity className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      <Tabs defaultValue="networks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="networks">Network Status</TabsTrigger>
          <TabsTrigger value="anchor">Anchor Evidence</TabsTrigger>
          <TabsTrigger value="verify">Verify Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(networks).map(([networkName, status]) => (
              <Card key={networkName}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getNetworkIcon(networkName)}
                    <CardTitle className="text-sm font-medium capitalize">
                      {networkName}
                    </CardTitle>
                  </div>
                  <Badge variant={status.connected ? "default" : "destructive"}>
                    {status.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Block Number:</span>
                    <span className="font-mono">{status.blockNumber.toLocaleString()}</span>
                  </div>
                  {status.gasPrice && (
                    <div className="flex justify-between text-sm">
                      <span>Gas Price:</span>
                      <span className="font-mono">{status.gasPrice} Gwei</span>
                    </div>
                  )}
                  {status.networkId && (
                    <div className="flex justify-between text-sm">
                      <span>Network ID:</span>
                      <span className="font-mono">{status.networkId}</span>
                    </div>
                  )}
                  {status.latestBlockHash && (
                    <div className="flex justify-between text-sm">
                      <span>Latest Block:</span>
                      <span className="font-mono text-xs">
                        {status.latestBlockHash.substring(0, 10)}...
                      </span>
                    </div>
                  )}
                  {status.error && (
                    <div className="text-sm text-red-500">
                      <AlertCircle className="inline h-3 w-3 mr-1" />
                      {status.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anchor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anchor Evidence to Multiple Chains</CardTitle>
              <CardDescription>
                Anchor your audit evidence to Polkadot, Ethereum, and Polygon simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evidence-hash">Evidence Hash</Label>
                <Input
                  id="evidence-hash"
                  placeholder="Enter evidence hash to anchor..."
                  value={evidenceHash}
                  onChange={(e) => setEvidenceHash(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleAnchorEvidence}
                disabled={!evidenceHash.trim() || anchoring}
                className="w-full"
              >
                {anchoring ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Anchoring...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Anchor to All Networks
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recently Anchored Evidence</CardTitle>
              <CardDescription>
                Evidence anchored across multiple blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anchoredEvidence.map((evidence) => (
                  <div key={evidence.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{evidence.evidenceHash}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {evidence.timestamp}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {evidence.networksAnchored.map(network => (
                            <Badge key={network} variant="secondary" className="text-xs">
                              {getNetworkIcon(network)}
                              <span className="ml-1">{network}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-2">
                          Multi-Chain Hash
                        </div>
                        <div className="font-mono text-sm">
                          {evidence.multiChainHash}
                        </div>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-center">
                          QR Code (Disabled)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {anchoredEvidence.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No evidence anchored yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Evidence</CardTitle>
              <CardDescription>
                Verify the authenticity of anchored evidence across all networks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-hash">Evidence Hash</Label>
                <Input
                  id="verify-hash"
                  placeholder="Enter evidence hash to verify..."
                  className="font-mono"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleVerifyEvidence}
                disabled={!verifyHash.trim() || verifying}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Evidence
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Multi-chain verification results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifyResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                    <div className="flex items-center space-x-2">
                      {verifyResult.overall_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">
                        Overall Status: {verifyResult.overall_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <Badge variant={verifyResult.multi_chain_consensus ? 'default' : 'secondary'}>
                      Consensus: {verifyResult.multi_chain_consensus ? 'Achieved' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Network Results</h4>
                    {Object.entries(verifyResult.network_results).map(([network, data]: [string, any]) => (
                      <div key={network} className="flex items-center justify-between border-b pb-2 text-sm">
                        <div className="flex items-center space-x-2 capitalize">
                          {getNetworkIcon(network)}
                          <span>{network}</span>
                        </div>
                        {data.verified ? (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Failed</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Enter an evidence hash to verify</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AuditShell>
  )
}
