"use client";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import PropTypes from "prop-types";

export default function RatingStars({ average = 0, count = 0, size = 14 }) {
  const avg = Number(average) || 0;
  const cnt = Number(count) || 0;

  if (cnt === 0 && avg === 0) return null;

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (avg >= i) {
      stars.push(<FaStar key={i} size={size} className="text-yellow-400" />);
    } else if (avg >= i - 0.5) {
      stars.push(
        <FaStarHalfAlt key={i} size={size} className="text-yellow-400" />
      );
    } else {
      stars.push(<FaRegStar key={i} size={size} className="text-gray-300" />);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {cnt > 0 && <span className="ms-1 text-xs text-gray-600">({cnt})</span>}
    </div>
  );
}

RatingStars.propTypes = {
  average: PropTypes.number,
  count: PropTypes.number,
  size: PropTypes.number,
};
