import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ResumePreview = () => {
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('resumeData');
    if (!data) {
      navigate('/');
      return;
    }
    setResumeData(JSON.parse(data));
  }, [navigate]);

  if (!resumeData) {
    return <div>Loading...</div>;
  }

  const {
    name,
    lkdn,
    gthb,
    prtf,
    cnt,
    mail,
    intro,
    skillsl1,
    skillsl2,
    skillsl3,
    clgname,
    education,
    grdyear,
    grdyear2,
    experiences,
    projects,
    achievements,
  } = resumeData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 p-10 rounded shadow">
      {/* Personal Details */}
      <h1 className="text-3xl font-bold mb-2">{name}</h1>

    
      <div className="flex flex-wrap gap-4 text-blue-600">
        <a href={lkdn} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <a href={gthb} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={prtf} target="_blank" rel="noopener noreferrer">
          Portfolio
        </a>
        <p>Contact: {cnt}</p>
        <p>Email: {mail}</p>
      </div>
<hr className="h-5"/>
      {/* Introduction */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">About Me</h2>
        <p>{intro}</p>
      </section>
<hr />
      {/* Skills */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">Skills</h2>
        <p>{skillsl1}</p>
        <p>{skillsl2}</p>
        <p>{skillsl3}</p>
      </section>
<hr />
      {/* Education */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">Education</h2>
        <p>
          <strong>{clgname}</strong>
        </p>
        <p>{education}</p>
        <p>
          {grdyear} - {grdyear2}
        </p>
      </section>
<hr />
      {/* Experience */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">Experience</h2>
        {experiences && experiences.length > 0 ? (
          <ul className="list-disc pl-5">
            {experiences.map((exp, index) => (
              <li key={index}>
                <strong>{exp.organization}</strong> - {exp.role} {exp.duration} <br />
                <p>{exp.responsibilities}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No experiences added yet.</p>
        )}
      </section>
<hr />
      {/* Projects */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">Projects</h2>
        {experiences && experiences.length > 0 ? (
          <ul className="list-disc pl-5">
            {experiences.map((exp, index) => (
              <li key={index}>
                <strong>{exp.project}</strong> - {exp.desc} {exp.durn} <br />
                
              </li>
            ))}
          </ul>
        ) : (
          <p>No experiences added yet.</p>
        )}
      </section>

      <hr />

      {/* Achievements */}
      <section className="my-6">
        <h2 className="text-xl font-bold mb-2">Achievements</h2>
        {achievements && achievements.length > 0 ? (
          <ul className="pl-5">
            {achievements.map((achievement, index) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        ) : (
          <p>No achievements added yet.</p>
        )}
      </section>

      <div className="mb-6 flex justify-center items-center">
        <button
          onClick={handlePrint}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Print Resume
        </button>
      </div>
    </div>
  );
};

export default ResumePreview;
