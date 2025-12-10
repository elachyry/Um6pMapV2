/**
 * Pathfinding Service
 * Purpose: A* pathfinding algorithm with POI prioritization
 * Inputs: POIs and Paths from cached data
 * Outputs: Optimal route between two points
 */

// ==================== INTERFACES ====================

interface PathNode {
  id: string
  coordinates: [number, number]
  connections: PathEdge[]
  floor?: number
  accessible?: boolean
  isPOI?: boolean
  poiId?: string
  buildingId?: number
  openSpaceId?: number
  isMainEntrance?: boolean
}

interface PathEdge {
  to: PathNode
  distance: number
  pathId: string
  type: string
  accessible: boolean
  coordinates: [number, number][]
}

interface AStarNode {
  node: PathNode
  gScore: number
  fScore: number
  parent?: AStarNode
}

export interface Route {
  id: string
  from: { id: string; name: string; coordinates: [number, number] }
  to: { id: string; name: string; coordinates: [number, number] }
  distance: number
  estimatedTime: number
  coordinates: [number, number][]
  instructions: RouteInstruction[]
}

export interface RouteInstruction {
  id: string
  type: 'start' | 'straight' | 'left' | 'right' | 'destination'
  description: string
  distance: number
  duration: number
  coordinates: [number, number]
}

// ==================== MIN HEAP ====================

class MinHeap<T> {
  private heap: T[] = []
  private compare: (a: T, b: T) => number

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare
  }

  push(item: T): void {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined
    if (this.heap.length === 1) return this.heap.pop()

    const result = this.heap[0]
    this.heap[0] = this.heap.pop()!
    this.bubbleDown(0)
    return result
  }

  size(): number {
    return this.heap.length
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(this.heap[index]!, this.heap[parentIndex]!) >= 0) break
      
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex]!, this.heap[index]!]
      index = parentIndex
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      let smallest = index
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2

      if (leftChild < this.heap.length && this.compare(this.heap[leftChild]!, this.heap[smallest]!) < 0) {
        smallest = leftChild
      }

      if (rightChild < this.heap.length && this.compare(this.heap[rightChild]!, this.heap[smallest]!) < 0) {
        smallest = rightChild
      }

      if (smallest === index) break

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest]!, this.heap[index]!]
      index = smallest
    }
  }
}

// ==================== PATHFINDING SERVICE ====================

export class PathfindingService {
  private nodes: Map<string, PathNode> = new Map()
  private pois: any[] = []
  private paths: any[] = []
  private distanceCache: Map<string, number> = new Map()

  constructor(pois: any[], paths: any[]) {
    this.pois = pois
    this.paths = paths
    this.buildGraph()
  }

  // ==================== GRAPH CONSTRUCTION ====================

  private buildGraph(): void {
    console.log('🔨 Building pathfinding graph...')
    console.log('📍 POIs:', this.pois.length)
    console.log('🛤️  Paths:', this.paths.length)

    // Debug: Log first POI structure
    if (this.pois.length > 0) {
      console.log('🔍 First POI structure:', this.pois[0])
    }

    // Debug: Log first Path structure
    if (this.paths.length > 0) {
      console.log('🔍 First Path structure:', this.paths[0])
    }

    this.createPOINodes()
    this.createPathNodes()
    this.createConnections()

    console.log('✅ Graph built with', this.nodes.size, 'nodes')
  }

  private createPOINodes(): void {
    let validPOIs = 0
    let invalidPOIs = 0

    this.pois.forEach(poi => {
      // Extract coordinates - handle different formats
      let coordinates: [number, number] | null = null

      if (poi.coordinates) {
        // If it's already an array
        if (Array.isArray(poi.coordinates) && poi.coordinates.length === 2 &&
            typeof poi.coordinates[0] === 'number' && typeof poi.coordinates[1] === 'number') {
          coordinates = poi.coordinates as [number, number]
        }
        // If it's a string (GeoJSON)
        else if (typeof poi.coordinates === 'string') {
          try {
            const parsed = JSON.parse(poi.coordinates)
            if (parsed.type === 'Point' && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
              coordinates = parsed.coordinates as [number, number]
            }
          } catch (e) {
            console.warn('Failed to parse POI coordinates:', poi.id, e)
          }
        }
      }

      // Try longitude/latitude fields
      if (!coordinates && poi.longitude !== undefined && poi.latitude !== undefined) {
        coordinates = [poi.longitude, poi.latitude]
      }

      if (!coordinates) {
        invalidPOIs++
        return
      }

      validPOIs++
      const nodeId = this.getNodeId(coordinates)
      const isMainEntrance = this.isMainEntrancePOI(poi)

      this.nodes.set(nodeId, {
        id: nodeId,
        coordinates: coordinates,
        connections: [],
        isPOI: true,
        poiId: poi.id,
        buildingId: poi.buildingId,
        openSpaceId: poi.openSpaceId,
        isMainEntrance,
        accessible: true
      })
    })

    console.log(`✅ Created ${validPOIs} POI nodes, ${invalidPOIs} invalid POIs`)
  }

  private isMainEntrancePOI(poi: any): boolean {
    if (!poi.name) return false
    return /\b(main|entrance|entry|principal|primary)\b/i.test(poi.name)
  }

  private createPathNodes(): void {
    let validPaths = 0
    let invalidPaths = 0

    this.paths.forEach(path => {
      // Extract coordinates - handle different formats
      let coordinates: [number, number][] = []

      if (path.coordinates) {
        // If it's already an array
        if (Array.isArray(path.coordinates)) {
          coordinates = path.coordinates
        }
        // If it's a string (GeoJSON)
        else if (typeof path.coordinates === 'string') {
          try {
            const parsed = JSON.parse(path.coordinates)
            if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
              coordinates = parsed.coordinates
            }
          } catch (e) {
            console.warn('Failed to parse path coordinates:', path.id, e)
          }
        }
      }

      if (coordinates.length === 0) {
        invalidPaths++
        return
      }

      validPaths++
      const isAccessible = path.isAccessible !== false

      coordinates.forEach((coord: [number, number]) => {
        if (!coord || !Array.isArray(coord) || coord.length !== 2) return
        if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') return

        const nodeId = this.getNodeId(coord)

        // Don't overwrite POI nodes
        if (!this.nodes.has(nodeId)) {
          this.nodes.set(nodeId, {
            id: nodeId,
            coordinates: coord,
            connections: [],
            floor: path.floor,
            accessible: isAccessible,
            isPOI: false
          })
        }
      })
    })

    console.log(`✅ Created path nodes from ${validPaths} paths, ${invalidPaths} invalid paths`)
  }

  private createConnections(): void {
    this.paths.forEach((path, pathIndex) => {
      // Extract coordinates - same logic as createPathNodes
      let coordinates: [number, number][] = []

      if (path.coordinates) {
        if (Array.isArray(path.coordinates)) {
          coordinates = path.coordinates
        } else if (typeof path.coordinates === 'string') {
          try {
            const parsed = JSON.parse(path.coordinates)
            if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
              coordinates = parsed.coordinates
            }
          } catch (e) {
            // Already logged in createPathNodes
          }
        }
      }

      if (coordinates.length === 0) return

      const pathId = path.id || `path-${pathIndex}`
      const isAccessible = path.isAccessible !== false

      // Connect consecutive coordinates
      for (let i = 0; i < coordinates.length - 1; i++) {
        const fromCoord = coordinates[i]
        const toCoord = coordinates[i + 1]

        if (!fromCoord || !toCoord) continue
        if (!Array.isArray(fromCoord) || !Array.isArray(toCoord)) continue

        const fromNode = this.nodes.get(this.getNodeId(fromCoord))
        const toNode = this.nodes.get(this.getNodeId(toCoord))

        if (!fromNode || !toNode) continue

        const distance = this.calculateDistance(fromCoord, toCoord)
        const segmentCoords: [number, number][] = [fromCoord, toCoord]

        // Add bidirectional connections
        fromNode.connections.push({
          to: toNode,
          distance,
          pathId,
          type: path.type || 'walkway',
          accessible: isAccessible,
          coordinates: segmentCoords
        })

        toNode.connections.push({
          to: fromNode,
          distance,
          pathId,
          type: path.type || 'walkway',
          accessible: isAccessible,
          coordinates: [...segmentCoords].reverse()
        })
      }
    })

    // Connect POIs to nearby path nodes
    this.connectPOIsToPathNetwork()
  }

  private connectPOIsToPathNetwork(): void {
    const MAX_CONNECTION_DISTANCE = 0.01 // ~1000 meters in degrees

    for (const poiNode of this.nodes.values()) {
      if (!poiNode.isPOI) continue

      let closestPathNode: PathNode | null = null
      let minDistance = Infinity

      // Find the closest path node to this POI
      for (const pathNode of this.nodes.values()) {
        if (pathNode.isPOI) continue

        const distance = this.calculateDistance(poiNode.coordinates, pathNode.coordinates)

        if (distance < minDistance && distance <= MAX_CONNECTION_DISTANCE) {
          minDistance = distance
          closestPathNode = pathNode
        }
      }

      // Create bidirectional connection
      if (closestPathNode) {
        const connectionCoords: [number, number][] = [poiNode.coordinates, closestPathNode.coordinates]

        poiNode.connections.push({
          to: closestPathNode,
          distance: minDistance,
          pathId: 'poi-connection',
          type: 'walkway',
          accessible: true,
          coordinates: connectionCoords
        })

        closestPathNode.connections.push({
          to: poiNode,
          distance: minDistance,
          pathId: 'poi-connection',
          type: 'walkway',
          accessible: true,
          coordinates: [...connectionCoords].reverse()
        })
      }
    }
  }

  // ==================== NODE SELECTION ====================

  private findBestConnectionNode(
    coordinates: [number, number],
    sourceCoordinates?: [number, number]
  ): PathNode | null {
    // 1. Try exact POI match
    const exactPOINode = this.findExactPOINode(coordinates)
    if (exactPOINode) return exactPOINode

    // 2. Try nearby POI with smart scoring
    const nearbyPOINode = this.findNearbyPOINode(coordinates, sourceCoordinates)
    if (nearbyPOINode) return nearbyPOINode

    // 3. Fallback to closest path node
    return this.findClosestPathNode(coordinates)
  }

  private findExactPOINode(coordinates: [number, number]): PathNode | null {
    const nodeId = this.getNodeId(coordinates)
    const node = this.nodes.get(nodeId)
    return node?.isPOI ? node : null
  }

  private findNearbyPOINode(
    coordinates: [number, number],
    sourceCoordinates?: [number, number]
  ): PathNode | null {
    const MAX_POI_DISTANCE = 0.005 // ~500 meters
    let bestNode: PathNode | null = null
    let bestScore = -1

    for (const node of this.nodes.values()) {
      if (!node.isPOI) continue

      const distance = this.calculateDistance(coordinates, node.coordinates)
      if (distance > MAX_POI_DISTANCE) continue

      // Base score: inversely proportional to distance
      let score = 1 / (distance + 0.001)

      // Route efficiency bonus (if source is provided)
      if (sourceCoordinates) {
        const sourceDistance = this.calculateDistance(sourceCoordinates, node.coordinates)
        const totalRouteDistance = sourceDistance + distance
        const directDistance = this.calculateDistance(sourceCoordinates, coordinates)

        const routeEfficiencyBonus = 1 / (totalRouteDistance + 0.001)
        score *= (1 + routeEfficiencyBonus)

        // Bonus if route via POI is not much longer than direct
        if (totalRouteDistance < directDistance * 1.2) {
          score *= 1.5
        }
      }

      // Main entrance bonus (3x multiplier)
      if (node.isMainEntrance) {
        score *= 3
      }

      // Building association bonus (2x multiplier)
      if (node.buildingId) {
        score *= 2
      }

      // Open space association bonus (1.5x multiplier)
      if (node.openSpaceId) {
        score *= 1.5
      }

      // Entrance-related name bonus
      const poi = this.pois.find(p => p.id === node.poiId)
      if (poi?.name) {
        if (/\b(door|entrance|entry|gate)\b/i.test(poi.name)) {
          score *= 1.3
        }

        // Back door bonus when close to both source and target
        if (/\b(back|rear|side)\s+(door|entrance)\b/i.test(poi.name) && sourceCoordinates) {
          const sourceDistance = this.calculateDistance(sourceCoordinates, node.coordinates)
          const targetDistance = this.calculateDistance(coordinates, node.coordinates)

          if (sourceDistance < 0.002 && targetDistance < 0.002) {
            score *= 1.8
          }
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestNode = node
      }
    }

    return bestNode
  }

  private findClosestPathNode(coordinates: [number, number]): PathNode | null {
    let closestNode: PathNode | null = null
    let minDistance = Infinity

    for (const node of this.nodes.values()) {
      const distance = this.calculateDistance(coordinates, node.coordinates)

      if (distance < minDistance) {
        minDistance = distance
        closestNode = node
      }
    }

    return closestNode
  }

  // ==================== A* ALGORITHM ====================

  private aStar(
    start: PathNode,
    goal: PathNode,
    options: { accessible?: boolean; avoidStairs?: boolean } = {}
  ): PathNode[] | null {
    const openSet = new MinHeap<AStarNode>((a, b) => a.fScore - b.fScore)
    const closedSet = new Set<string>()
    const gScores = new Map<string, number>()

    const startAStarNode: AStarNode = {
      node: start,
      gScore: 0,
      fScore: this.heuristic(start, goal)
    }

    openSet.push(startAStarNode)
    gScores.set(start.id, 0)

    while (openSet.size() > 0) {
      const current = openSet.pop()!

      // Goal reached
      if (current.node.id === goal.id) {
        return this.reconstructPath(current)
      }

      closedSet.add(current.node.id)

      // Explore neighbors
      for (const edge of current.node.connections) {
        const neighbor = edge.to

        if (closedSet.has(neighbor.id)) {
          continue
        }

        // Skip inaccessible paths if accessibility required
        if (options.accessible && !edge.accessible) {
          continue
        }

        // Skip stairs if avoiding stairs
        if (options.avoidStairs && edge.type === 'stairs') {
          continue
        }

        const tentativeGScore = current.gScore + this.calculateEdgeCost(edge, neighbor)

        if (!gScores.has(neighbor.id) || tentativeGScore < gScores.get(neighbor.id)!) {
          const neighborAStarNode: AStarNode = {
            node: neighbor,
            gScore: tentativeGScore,
            fScore: tentativeGScore + this.heuristic(neighbor, goal),
            parent: current
          }

          gScores.set(neighbor.id, tentativeGScore)
          openSet.push(neighborAStarNode)
        }
      }
    }

    return null // No path found
  }

  private calculateEdgeCost(edge: PathEdge, targetNode: PathNode): number {
    let cost = edge.distance

    // POI discount (20% off)
    if (targetNode.isPOI) {
      cost *= 0.8
    }

    // Main entrance discount (additional 30% off)
    if (targetNode.isMainEntrance) {
      cost *= 0.7
    }

    // Stairs penalty (50% more expensive)
    if (edge.type === 'stairs') {
      cost *= 1.5
    }

    return cost
  }

  private heuristic(node: PathNode, goal: PathNode): number {
    return this.calculateDistance(node.coordinates, goal.coordinates)
  }

  private reconstructPath(node: AStarNode): PathNode[] {
    const path: PathNode[] = []
    let current: AStarNode | undefined = node

    while (current) {
      path.unshift(current.node)
      current = current.parent
    }

    return path
  }

  // ==================== PUBLIC API ====================

  public findRoute(
    from: [number, number],
    to: [number, number],
    fromName: string = 'Start',
    toName: string = 'Destination',
    options: { accessible?: boolean; avoidStairs?: boolean } = {}
  ): Route | null {
    console.log('🔍 Finding route from', fromName, 'to', toName)

    // Find best connection nodes
    const startNode = this.findBestConnectionNode(from, to)
    const goalNode = this.findBestConnectionNode(to, from)

    if (!startNode || !goalNode) {
      console.warn('⚠️ Could not find connection nodes')
      return this.createDirectRoute(from, to, fromName, toName)
    }

    console.log('📍 Start node:', startNode.isPOI ? 'POI' : 'Path', startNode.id)
    console.log('📍 Goal node:', goalNode.isPOI ? 'POI' : 'Path', goalNode.id)

    // Run A* algorithm
    const path = this.aStar(startNode, goalNode, options)

    if (!path || path.length === 0) {
      console.warn('⚠️ No path found')
      return this.createDirectRoute(from, to, fromName, toName)
    }

    console.log('✅ Path found with', path.length, 'nodes')

    // Create route from path
    return this.createRouteFromPath(path, from, to, fromName, toName)
  }

  // ==================== ROUTE GENERATION ====================

  private createRouteFromPath(
    path: PathNode[],
    from: [number, number],
    to: [number, number],
    fromName: string,
    toName: string
  ): Route {
    const coordinates: [number, number][] = [from]

    // Add path coordinates
    path.forEach(node => {
      coordinates.push(node.coordinates)
    })

    // Add destination if different from last node
    const lastCoord = coordinates[coordinates.length - 1]
    if (!lastCoord || (lastCoord[0] !== to[0] || lastCoord[1] !== to[1])) {
      coordinates.push(to)
    }

    const distance = this.calculatePathDistance(coordinates)
    const estimatedTime = Math.round(distance / 80) // 80 m/min walking speed

    // Generate instructions
    const instructions: RouteInstruction[] = [
      {
        id: 'start',
        type: 'start',
        description: `Start at ${fromName}`,
        distance: 0,
        duration: 0,
        coordinates: from
      }
    ]

    // Add intermediate instructions
    for (let i = 1; i < coordinates.length - 1; i++) {
      const coord = coordinates[i]
      if (coord) {
        const segmentDistance = this.calculateDistance(coordinates[i - 1]!, coord) * 111000
        instructions.push({
          id: `step-${i}`,
          type: 'straight',
          description: 'Continue along the path',
          distance: segmentDistance,
          duration: Math.round(segmentDistance / 80),
          coordinates: coord
        })
      }
    }

    instructions.push({
      id: 'destination',
      type: 'destination',
      description: `Arrive at ${toName}`,
      distance: distance,
      duration: estimatedTime,
      coordinates: to
    })

    return {
      id: `route-${Date.now()}`,
      from: { id: 'start', name: fromName, coordinates: from },
      to: { id: 'end', name: toName, coordinates: to },
      distance,
      estimatedTime,
      coordinates,
      instructions
    }
  }

  private createDirectRoute(
    from: [number, number],
    to: [number, number],
    fromName: string,
    toName: string
  ): Route {
    const distance = this.calculateDistance(from, to) * 111000 // Convert to meters
    const estimatedTime = Math.round(distance / 80) // 80 m/min

    return {
      id: `direct-${Date.now()}`,
      from: { id: 'start', name: fromName, coordinates: from },
      to: { id: 'end', name: toName, coordinates: to },
      distance,
      estimatedTime,
      coordinates: [from, to],
      instructions: [
        {
          id: 'start',
          type: 'start',
          description: `Start at ${fromName}`,
          distance: 0,
          duration: 0,
          coordinates: from
        },
        {
          id: 'destination',
          type: 'destination',
          description: `Arrive at ${toName}`,
          distance,
          duration: estimatedTime,
          coordinates: to
        }
      ]
    }
  }

  // ==================== UTILITIES ====================

  private getNodeId(coordinates: [number, number]): string {
    return `${coordinates[0].toFixed(9)},${coordinates[1].toFixed(9)}`
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    // Validate coordinates
    if (!coord1 || !coord2 || !Array.isArray(coord1) || !Array.isArray(coord2)) {
      console.warn('⚠️ Invalid coordinates:', coord1, coord2)
      return Infinity
    }

    if (typeof coord1[0] !== 'number' || typeof coord1[1] !== 'number' ||
        typeof coord2[0] !== 'number' || typeof coord2[1] !== 'number') {
      console.warn('⚠️ Coordinates are not numbers:', coord1, coord2)
      return Infinity
    }

    const key = `${coord1[0].toFixed(9)},${coord1[1].toFixed(9)}-${coord2[0].toFixed(9)},${coord2[1].toFixed(9)}`

    const cached = this.distanceCache.get(key)
    if (cached !== undefined) return cached

    // Haversine formula
    const [lon1, lat1] = coord1
    const [lon2, lat2] = coord2

    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c / 111 // Convert to degrees

    this.distanceCache.set(key, distance)

    return distance
  }

  private calculatePathDistance(coordinates: [number, number][]): number {
    let totalDistance = 0

    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += this.calculateDistance(coordinates[i]!, coordinates[i + 1]!) * 111000 // Convert to meters
    }

    return totalDistance
  }

  // ==================== POI HELPERS ====================

  public findPOIsForBuilding(buildingId: number): any[] {
    return this.pois.filter(poi => poi.buildingId === buildingId)
  }

  public findPOIsForOpenSpace(openSpaceId: number): any[] {
    return this.pois.filter(poi => poi.openSpaceId === openSpaceId)
  }

  public findNearestPOI(coordinates: [number, number], buildingId?: number, openSpaceId?: number): any | null {
    let candidatePOIs = this.pois

    if (buildingId) {
      candidatePOIs = this.findPOIsForBuilding(buildingId)
    } else if (openSpaceId) {
      candidatePOIs = this.findPOIsForOpenSpace(openSpaceId)
    }

    if (candidatePOIs.length === 0) {
      console.warn('⚠️ No POIs found for', buildingId ? `building ${buildingId}` : openSpaceId ? `open space ${openSpaceId}` : 'general search')
      return null
    }

    // Filter POIs with valid coordinates
    const validPOIs = candidatePOIs.filter(poi => 
      poi.coordinates && 
      Array.isArray(poi.coordinates) && 
      poi.coordinates.length === 2 &&
      typeof poi.coordinates[0] === 'number' &&
      typeof poi.coordinates[1] === 'number'
    )

    if (validPOIs.length === 0) {
      console.warn('⚠️ No POIs with valid coordinates found')
      return null
    }

    let nearestPOI = validPOIs[0]
    let minDistance = this.calculateDistance(coordinates, nearestPOI.coordinates)

    for (const poi of validPOIs) {
      const distance = this.calculateDistance(coordinates, poi.coordinates)
      if (distance < minDistance) {
        minDistance = distance
        nearestPOI = poi
      }
    }

    console.log('📍 Found nearest POI:', nearestPOI.name, 'at distance:', minDistance)
    return nearestPOI
  }
}
