"use client"
// Post-game Page
// Route: /game/postgame
// Shows the map of every round played in the last game, read from sessionStorage

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useJsApiLoader, GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api"
import styles from "./page.module.css"
import { POSTGAME_STORAGE_KEY } from '../postgameStorage.js'

// Must match the loader options in game/page.js, the loader only accepts one config per id
const GOOGLE_MAPS_LIBRARIES = ['places']
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const MAX_SCORE = 5000

function loadRounds() {
    try {
        return JSON.parse(sessionStorage.getItem(POSTGAME_STORAGE_KEY)) || []
    } catch {
        return []
    }
}

function RoundMap({ round, isLoaded }) {
    const { goal, guess } = round

    // Frame both markers when there is a guess, otherwise zoom in on the answer
    const handleLoad = useCallback((map) => {
        if (!guess) return
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(goal)
        bounds.extend(guess)
        map.fitBounds(bounds, 40)
    }, [goal, guess])

    if (!isLoaded) return <div className={styles.mapPlaceholder} />

    const flagIcon = {
        url: "/flag.png",
        scaledSize: new window.google.maps.Size(65, 50)
    }

    return (
        <GoogleMap
            mapContainerClassName={styles.map}
            center={goal}
            zoom={16}
            onLoad={handleLoad}
            options={{
                disableDefaultUI: true,
                streetViewControl: false,
                disableDoubleClickZoom: true
            }}
        >
            <MarkerF position={goal} title="Correct Location" icon={flagIcon} />
            {guess && (
                <>
                    <MarkerF position={guess} title="Your Guess" />
                    <PolylineF
                        path={[goal, guess]}
                        options={{
                            strokeColor: "#cc860e",
                            strokeOpacity: 0.75,
                            strokeWeight: 4,
                        }}
                    />
                </>
            )}
        </GoogleMap>
    )
}

export default function PostGame() {
    const [rounds, setRounds] = useState([])

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    })

    useEffect(() => {
        setRounds(loadRounds())
    }, [])

    const totalScore = rounds.reduce((sum, round) => sum + round.score, 0)

    return (
        <div className={styles.postGame}>
            <Link href="/lobby">
                <img src="/logo.png" className={styles.logo} alt="Logo" />
            </Link>
            <h1>Game Over!</h1>
            {rounds.length === 0 ? (
                <p>No rounds to show - play a game first!</p>
            ) : (
                <>
                    <h2>Total: {totalScore} / {MAX_SCORE * rounds.length}pts</h2>
                    <div className={styles.roundList}>
                        {rounds.map((round, index) => (
                            <div className={styles.roundCard} key={index}>
                                <h3>Round {index + 1}</h3>
                                <RoundMap round={round} isLoaded={isLoaded} />
                                <div className={styles.roundScore}>{round.score}pts</div>
                                <div>
                                    {round.guess
                                        ? `${round.distance.toFixed(2)}km away`
                                        : "No guess placed"}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <Link href="/lobby">
                <button type="button" className={styles.lobbyButton}>Return to lobby</button>
            </Link>
        </div>
    )
}
